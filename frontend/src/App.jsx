import { useState } from "react";
import { Button, Card, Container, Modal } from "react-bootstrap";

import DocumentPreview from "./components/DocumentPreview";
import MedicalRecordPanel from "./components/MedicalRecordPanel";
import UploadPanel from "./components/UploadPanel";
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
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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
      setSelectedFile(null);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Scan failed.");
    } finally {
      setIsScanning(false);
    }
  };

  const currentStep = scanCompleted ? "structured" : selectedFile ? "preview" : "upload";

  const handleConfirmReset = () => {
    setMedicalRecord(getInitialMedicalRecordState());
    setSelectedFile(null);
    setScanError("");
    setIsScanning(false);
    setScanCompleted(false);
    setShowResetConfirm(false);
  };

  return (
    <main className="hv-app-page">
      <Container className="hv-app-container">
        <section>
          {currentStep === "upload" ? (
            <section className="hv-upload-screen">
              <header className="hv-upload-header">
                <div className="hv-upload-header-copy">
                  <h1 className="h1 mb-0 hv-title hv-upload-header-title">
                    <span>{validatedUiContent.app.uploadHeaderLine1Prefix}</span>{" "}
                    <span className="hv-rotating-words" aria-label="Supported input types">
                      {ROTATING_UPLOAD_WORDS.map((word) => (
                        <span key={word} className="hv-rotating-word">{word}</span>
                      ))}
                    </span>
                  </h1>
                  <p className="mb-0 hv-upload-header-subtitle">
                    {validatedUiContent.app.uploadHeaderLine2}
                  </p>
                </div>
              </header>
              <div className="hv-upload-corner-icon" aria-label="HappyVet Pulse">
                <img src="/vetpulse-icon.svg" alt="" width="28" height="28" decoding="async" />
              </div>
              <div className="hv-upload-main">
                <UploadPanel
                  onFileSelected={handleFileSelected}
                  content={validatedUiContent.uploadPanel}
                />
              </div>
            </section>
          ) : null}

          {currentStep === "preview" && selectedFile ? (
            <>
              <Card className="hv-card hv-card-spaced">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <h2 className="h6 mb-0 hv-title">
                      {validatedUiContent.documentPreview.title}
                    </h2>
                    <Button type="button" className="hv-primary-btn" onClick={handleScan}>
                      {validatedUiContent.uploadPanel.scanButton}
                    </Button>
                  </div>
                  {isScanning ? (
                    <p className="mt-2 mb-0 hv-info-text">
                      {validatedUiContent.uploadPanel.scanningMessage}
                    </p>
                  ) : null}
                  {scanError ? (
                    <p className="mt-2 mb-0 hv-error-text">
                      {validatedUiContent.uploadPanel.scanErrorPrefix} {scanError}
                    </p>
                  ) : null}
                </Card.Body>
              </Card>
              <DocumentPreview file={selectedFile} content={validatedUiContent.documentPreview} />
            </>
          ) : null}

          {currentStep === "structured" ? (
            <>
              <div className="d-flex justify-content-end hv-reset-row">
                <Button
                  type="button"
                  aria-label={validatedUiContent.app.resetFlow.buttonAriaLabel}
                  onClick={() => setShowResetConfirm(true)}
                  className="hv-reset-btn"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    width="20"
                    height="20"
                    fill="currentColor"
                  >
                    <path d="M8 3a5 5 0 1 1-4.546 2.916.5.5 0 0 1 .908-.418A4 4 0 1 0 8 4h2.5a.5.5 0 0 1 0 1H7.5A.5.5 0 0 1 7 4.5v-3a.5.5 0 0 1 1 0V3z" />
                  </svg>
                </Button>
              </div>
              <MedicalRecordPanel
                medicalRecord={medicalRecord}
                content={validatedUiContent.app.medicalRecord}
              />
            </>
          ) : null}
        </section>
      </Container>
      <Button type="button" className="hv-theme-fab" aria-label={validatedUiContent.app.themeFabAriaLabel}>
        ◐
      </Button>
      <Modal show={showResetConfirm} onHide={() => setShowResetConfirm(false)} centered>
        <Modal.Header closeButton className="hv-modal-header">
          <Modal.Title className="hv-modal-title">
            {validatedUiContent.app.resetFlow.confirmTitle}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="hv-modal-body">
          {validatedUiContent.app.resetFlow.confirmMessage}
        </Modal.Body>
        <Modal.Footer className="hv-modal-footer">
          <Button
            variant="secondary"
            className="hv-modal-btn-min"
            onClick={() => setShowResetConfirm(false)}
          >
            {validatedUiContent.app.resetFlow.confirmNo}
          </Button>
          <Button className="hv-primary-btn hv-modal-btn-min" onClick={handleConfirmReset}>
            {validatedUiContent.app.resetFlow.confirmYes}
          </Button>
        </Modal.Footer>
      </Modal>
    </main>
  );
}

export default App;
