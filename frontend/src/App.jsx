import { useState } from "react";
import { Button, Card, Container, Modal } from "react-bootstrap";

import DocumentPreview from "./components/DocumentPreview";
import MedicalRecordPanel from "./components/MedicalRecordPanel";
import UploadPanel from "./components/UploadPanel";
import { getInitialMedicalRecordState } from "./data/medicalRecordState";
import uiContent from "./data/uiContent.json";
import { scanDocument } from "./hooks/uploadDocument";
import { previewStyles, sharedStyles, uiTheme, uploadStyles } from "./styles/uiTheme";
import { validateUiContent } from "./utils/validateUiContent";

const validatedUiContent = validateUiContent(uiContent);

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
    <main style={sharedStyles.mainPage}>
      <Container style={{ maxWidth: uiTheme.layout.appMaxWidth }}>
        <section>
          {currentStep === "upload" ? (
            <UploadPanel
              onFileSelected={handleFileSelected}
              title={validatedUiContent.app.uploadTitle}
              content={validatedUiContent.uploadPanel}
            />
          ) : null}

          {currentStep === "preview" && selectedFile ? (
            <>
              <Card style={{ ...sharedStyles.baseCard, marginTop: "16px" }}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <h2 className="h6 mb-0" style={sharedStyles.panelTitle}>
                      {validatedUiContent.documentPreview.title}
                    </h2>
                    <Button type="button" style={uploadStyles.button} onClick={handleScan}>
                      {validatedUiContent.uploadPanel.scanButton}
                    </Button>
                  </div>
                  {isScanning ? (
                    <p className="mt-2 mb-0" style={previewStyles.infoText}>
                      {validatedUiContent.uploadPanel.scanningMessage}
                    </p>
                  ) : null}
                  {scanError ? (
                    <p className="mt-2 mb-0" style={previewStyles.errorText}>
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
              <div className="d-flex justify-content-end" style={{ marginTop: "20px", marginBottom: "4px" }}>
                <Button
                  type="button"
                  aria-label={validatedUiContent.app.resetFlow.buttonAriaLabel}
                  onClick={() => setShowResetConfirm(true)}
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: uiTheme.colors.primary,
                    borderColor: uiTheme.colors.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    boxShadow: "0 4px 12px rgba(253, 77, 13, 0.25)",
                    transition: "transform 120ms ease, box-shadow 120ms ease",
                  }}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    width="20"
                    height="20"
                    fill="currentColor"
                    style={{ lineHeight: 1 }}
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
      <Modal show={showResetConfirm} onHide={() => setShowResetConfirm(false)} centered>
        <Modal.Header
          closeButton
          style={{
            backgroundColor: uiTheme.colors.bgMain,
            borderBottomColor: uiTheme.colors.accentSoft,
          }}
        >
          <Modal.Title
            style={{
              fontFamily: uiTheme.typography.titleFontFamily,
              color: uiTheme.colors.primary,
            }}
          >
            {validatedUiContent.app.resetFlow.confirmTitle}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            backgroundColor: uiTheme.colors.white,
            color: uiTheme.colors.accentInfo,
            padding: "20px 24px 12px 24px",
          }}
        >
          {validatedUiContent.app.resetFlow.confirmMessage}
        </Modal.Body>
        <Modal.Footer
          style={{
            borderTopColor: uiTheme.colors.accentSoft,
            padding: "12px 24px 20px 24px",
            gap: "8px",
          }}
        >
          <Button
            variant="secondary"
            style={{ minWidth: "88px" }}
            onClick={() => setShowResetConfirm(false)}
          >
            {validatedUiContent.app.resetFlow.confirmNo}
          </Button>
          <Button
            style={{
              backgroundColor: uiTheme.colors.primary,
              borderColor: uiTheme.colors.primary,
              minWidth: "88px",
            }}
            onClick={handleConfirmReset}
          >
            {validatedUiContent.app.resetFlow.confirmYes}
          </Button>
        </Modal.Footer>
      </Modal>
    </main>
  );
}

export default App;
