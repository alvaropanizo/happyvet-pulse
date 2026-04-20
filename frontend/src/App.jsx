import { useState } from "react";
import { Button, Card, Modal } from "react-bootstrap";

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
const ROTATING_UPLOAD_WORDS = ["files", "documents", "PDFs", "docs", "txt", "images"];

function App() {
  const [medicalRecord, setMedicalRecord] = useState(() => getInitialMedicalRecordState());
  const [selectedFile, setSelectedFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanCompleted, setScanCompleted] = useState(false);
  const [showRemoveFileConfirm, setShowRemoveFileConfirm] = useState(false);

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

  const handleConfirmRemoveFile = () => {
    setSelectedFile(null);
    setScanError("");
    setShowRemoveFileConfirm(false);
    setScanCompleted(false);
    setMedicalRecord(getInitialMedicalRecordState());
  };

  return (
    <>
      <AppShell
        brandingAriaLabel={validatedUiContent.app.brandingAriaLabel}
        footerContent={validatedUiContent.app.footer}
        themeFabAriaLabel={validatedUiContent.app.themeFabAriaLabel}
      >
        <div key={showReviewSplit ? "review" : "upload"} className="hv-step-transition">
          {currentStep === "upload" ? (
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
              leftPane={
                <div
                  className={`hv-review-left-stack${scanCompleted ? " hv-review-left-stack--after-scan" : ""}`}
                >
                  <Card className="hv-card hv-card-spaced hv-review-left-card">
                    <DocumentReviewToolbar
                      file={selectedFile}
                      scanButtonLabel={validatedUiContent.uploadPanel.scanButton}
                      content={validatedUiContent.documentReviewToolbar}
                      onScan={handleScan}
                      onRemoveClick={() => setShowRemoveFileConfirm(true)}
                      isScanning={isScanning}
                      scanComplete={scanCompleted}
                    />
                    {scanError ? (
                      <Card.Body className="hv-review-toolbar-card-error px-3 py-2">
                        <p className="mb-0 small hv-error-text">
                          {validatedUiContent.uploadPanel.scanErrorPrefix} {scanError}
                        </p>
                      </Card.Body>
                    ) : null}
                  </Card>
                  <DocumentPreview
                    file={selectedFile}
                    content={validatedUiContent.documentPreview}
                    embedded
                  />
                </div>
              }
              rightPane={
                currentStep === "structured" ? (
                  <div className="hv-review-right-stack">
                    <MedicalRecordPanel
                      medicalRecord={medicalRecord}
                      content={validatedUiContent.app.medicalRecord}
                    />
                  </div>
                ) : (
                  <DocumentReviewRightPanel
                    isScanning={isScanning}
                    skeletonAriaLabel={validatedUiContent.documentReviewLayout.recordSkeletonAriaLabel}
                    scanningAriaLabel={validatedUiContent.documentReviewLayout.scanningRightPanelAriaLabel}
                  />
                )
              }
            />
          ) : null}
        </div>
      </AppShell>

      <Modal show={showRemoveFileConfirm} onHide={() => setShowRemoveFileConfirm(false)} centered>
        <Modal.Header closeButton className="hv-modal-header">
          <Modal.Title className="hv-modal-title">
            {validatedUiContent.documentReviewToolbar.confirmRemoveTitle}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="hv-modal-body">
          {validatedUiContent.documentReviewToolbar.confirmRemoveMessage}
        </Modal.Body>
        <Modal.Footer className="hv-modal-footer">
          <Button
            variant="secondary"
            className="hv-modal-btn-min"
            onClick={() => setShowRemoveFileConfirm(false)}
          >
            {validatedUiContent.documentReviewToolbar.confirmRemoveNo}
          </Button>
          <Button className="hv-primary-btn hv-modal-btn-min" onClick={handleConfirmRemoveFile}>
            {validatedUiContent.documentReviewToolbar.confirmRemoveYes}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default App;
