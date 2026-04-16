import { useState } from "react";
import { Container } from "react-bootstrap";

import DocumentPreview from "./components/DocumentPreview";
import MedicalRecordPanel from "./components/MedicalRecordPanel";
import RecentDocumentsPanel from "./components/RecentDocumentsPanel";
import UploadResultCard from "./components/UploadResultCard";
import UploadPanel from "./components/UploadPanel";
import { getInitialMedicalRecordState } from "./data/medicalRecordState";
import uiContent from "./data/uiContent.json";
import { scanDocument, uploadDocument } from "./hooks/uploadDocument";
import { sharedStyles, uiTheme } from "./styles/uiTheme";
import { validateUiContent } from "./utils/validateUiContent";

const validatedUiContent = validateUiContent(uiContent);

function App() {
  const [medicalRecord, setMedicalRecord] = useState(() => getInitialMedicalRecordState());
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [uploadMetadata, setUploadMetadata] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState("");

  const handleFileSelected = async (file) => {
    setSelectedFile(file);
    setUploadedDocuments((previous) => [file.name, ...previous.filter((name) => name !== file.name)]);
    setUploadMetadata(null);
    setUploadError("");
    setIsUploading(true);

    try {
      const metadata = await uploadDocument(file);
      setUploadMetadata(metadata);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleScan = async () => {
    setScanError("");
    setIsScanning(true);

    try {
      const scannedRecord = await scanDocument();
      setMedicalRecord(scannedRecord);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Scan failed.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <main style={sharedStyles.mainPage}>
      <Container style={{ maxWidth: uiTheme.layout.appMaxWidth }}>
        <div style={sharedStyles.appGrid}>
          <RecentDocumentsPanel
            documents={uploadedDocuments}
            content={validatedUiContent.recentDocumentsPanel}
          />
          <section>
            <UploadPanel
              onFileSelected={handleFileSelected}
              onScan={handleScan}
              selectedFileName={selectedFile?.name ?? ""}
              title={validatedUiContent.app.uploadTitle}
              content={validatedUiContent.uploadPanel}
              isUploading={isUploading}
              uploadError={uploadError}
              isScanning={isScanning}
              scanError={scanError}
            />
            <UploadResultCard
              metadata={uploadMetadata}
              content={validatedUiContent.app.uploadResult}
            />
            <MedicalRecordPanel
              medicalRecord={medicalRecord}
              content={validatedUiContent.app.medicalRecord}
            />
            {selectedFile ? (
              <DocumentPreview file={selectedFile} content={validatedUiContent.documentPreview} />
            ) : null}
          </section>
        </div>
      </Container>
    </main>
  );
}

export default App;
