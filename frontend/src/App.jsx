import { useEffect, useState } from "react";
import { Card } from "react-bootstrap";

import ConfirmModal from "./components/common/ConfirmModal";
import DocumentPreview from "./components/DocumentPreview";
import DocumentReviewRightPanel from "./components/DocumentReviewRightPanel";
import DocumentReviewSplitLayout from "./components/DocumentReviewSplitLayout";
import DocumentReviewToolbar from "./components/DocumentReviewToolbar";
import AppShell from "./components/layout/AppShell";
import MedicalRecordPanel from "./components/MedicalRecordPanel";
import UploadLandingSection from "./components/UploadLandingSection";
import { getInitialMedicalRecordState } from "./data/medicalRecordState";
import uiContent from "./data/uiContent.json";
import { scanDocument } from "./hooks/uploadDocument";
import { validateUiContent } from "./utils/validateUiContent";

const validatedUiContent = validateUiContent(uiContent);
const ROTATING_UPLOAD_WORDS = ["files", "documents", "images", "PDFs", ".doc/docx", ".txt"];
const THEME_STORAGE_KEY = "hv-theme";
const SCAN_NUDGE_IDLE_MS = 3000;

function getInitialDarkMode() {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return false;
}

function App() {
  const [medicalRecord, setMedicalRecord] = useState(() => getInitialMedicalRecordState());
  const [selectedFile, setSelectedFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanCompleted, setScanCompleted] = useState(false);
  const [showRemoveFileConfirm, setShowRemoveFileConfirm] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);
  const [shouldNudgeScan, setShouldNudgeScan] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", isDarkMode ? "dark" : "light");
    window.localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    const shouldTrackInactivity = Boolean(selectedFile) && !scanCompleted && !isScanning;
    if (!shouldTrackInactivity) {
      setShouldNudgeScan(false);
      return undefined;
    }

    let idleTimeoutId = null;
    const activityEvents = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

    const restartIdleTimer = () => {
      if (idleTimeoutId) window.clearTimeout(idleTimeoutId);
      setShouldNudgeScan(false);
      idleTimeoutId = window.setTimeout(() => {
        setShouldNudgeScan(true);
      }, SCAN_NUDGE_IDLE_MS);
    };

    restartIdleTimer();
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, restartIdleTimer, { passive: true });
    });

    return () => {
      if (idleTimeoutId) window.clearTimeout(idleTimeoutId);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, restartIdleTimer);
      });
    };
  }, [selectedFile, scanCompleted, isScanning]);

  const handleFileSelected = (file) => {
    setSelectedFile(file);
    setScanCompleted(false);
    setScanError("");
  };

  const handleScan = async () => {
    setScanError("");
    setIsScanning(true);

    try {
      if (!selectedFile) {
        throw new Error("Please select a document before scanning.");
      }

      const scannedRecord = await scanDocument(selectedFile);
      setMedicalRecord(scannedRecord);
      setScanCompleted(true);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Scan failed.");
    } finally {
      setIsScanning(false);
    }
  };

  const currentStep = scanCompleted ? "structured" : selectedFile ? "preview" : "upload";
  const showReviewSplit = Boolean(selectedFile);
  const isUploadStep = currentStep === "upload";
  const handleCloseRemoveModal = () => setShowRemoveFileConfirm(false);

  const handleConfirmRemoveFile = () => {
    setSelectedFile(null);
    setScanError("");
    setShowRemoveFileConfirm(false);
    setScanCompleted(false);
    setMedicalRecord(getInitialMedicalRecordState());
  };

  const reviewLeftPane = (
    <div className={`hv-review-left-stack${scanCompleted ? " hv-review-left-stack--after-scan" : ""}`}>
      <Card className="hv-card hv-card-spaced hv-review-left-card">
        <DocumentReviewToolbar
          file={selectedFile}
          scanButtonLabel={validatedUiContent.uploadPanel.scanButton}
          content={validatedUiContent.documentReviewToolbar}
          onScan={handleScan}
          onRemoveClick={() => setShowRemoveFileConfirm(true)}
          isScanning={isScanning}
          scanComplete={scanCompleted}
          shouldNudgeScan={shouldNudgeScan}
        />
      </Card>
      <DocumentPreview file={selectedFile} content={validatedUiContent.documentPreview} embedded />
    </div>
  );

  const reviewRightPane = currentStep === "structured" ? (
    <div className="hv-review-right-stack">
      <MedicalRecordPanel medicalRecord={medicalRecord} content={validatedUiContent.app.medicalRecord} />
    </div>
  ) : (
    <DocumentReviewRightPanel
      isScanning={isScanning}
      scanError={scanError}
      scanErrorPrefix={validatedUiContent.uploadPanel.scanErrorPrefix}
      skeletonAriaLabel={validatedUiContent.documentReviewLayout.recordSkeletonAriaLabel}
      scanningAriaLabel={validatedUiContent.documentReviewLayout.scanningRightPanelAriaLabel}
      content={validatedUiContent.documentReviewRightPanel}
    />
  );

  return (
    <>
      <AppShell
        brandingAriaLabel={validatedUiContent.app.brandingAriaLabel}
        footerContent={validatedUiContent.app.footer}
        themeFabAriaLabel={validatedUiContent.app.themeFabAriaLabel}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode((previous) => !previous)}
      >
        <div key={showReviewSplit ? "review" : "upload"} className="hv-step-transition">
          {isUploadStep ? (
            <UploadLandingSection
              onFileSelected={handleFileSelected}
              uploadContent={validatedUiContent.uploadPanel}
              uploadHeaderLine1Prefix={validatedUiContent.app.uploadHeaderLine1Prefix}
              uploadHeaderLine2={validatedUiContent.app.uploadHeaderLine2}
              rotatingWords={ROTATING_UPLOAD_WORDS}
            />
          ) : null}

          {showReviewSplit ? (
            <DocumentReviewSplitLayout
              leftPaneTitle={null}
              layoutAriaLabel={validatedUiContent.documentReviewLayout.layoutAriaLabel}
              leftPane={reviewLeftPane}
              rightPane={reviewRightPane}
              scanCompleted={scanCompleted}
            />
          ) : null}
        </div>
      </AppShell>

      <ConfirmModal
        show={showRemoveFileConfirm}
        onHide={handleCloseRemoveModal}
        title={validatedUiContent.documentReviewToolbar.confirmRemoveTitle}
        body={validatedUiContent.documentReviewToolbar.confirmRemoveMessage}
        cancelLabel={validatedUiContent.documentReviewToolbar.confirmRemoveNo}
        confirmLabel={validatedUiContent.documentReviewToolbar.confirmRemoveYes}
        onConfirm={handleConfirmRemoveFile}
      />
    </>
  );
}

export default App;
