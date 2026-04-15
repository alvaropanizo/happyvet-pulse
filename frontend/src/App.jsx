import { useState } from "react";
import { Container } from "react-bootstrap";

import DocumentPreview from "./components/DocumentPreview";
import RecentDocumentsPanel from "./components/RecentDocumentsPanel";
import UploadResultCard from "./components/UploadResultCard";
import UploadPanel from "./components/UploadPanel";
import uiContent from "./data/uiContent.json";
import { uploadDocument } from "./hooks/uploadDocument";
import { sharedStyles, uiTheme } from "./styles/uiTheme";
import { validateUiContent } from "./utils/validateUiContent";

const validatedUiContent = validateUiContent(uiContent);

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [uploadMetadata, setUploadMetadata] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

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
              selectedFileName={selectedFile?.name ?? ""}
              title={validatedUiContent.app.uploadTitle}
              content={validatedUiContent.uploadPanel}
              isUploading={isUploading}
              uploadError={uploadError}
            />
            <UploadResultCard
              metadata={uploadMetadata}
              content={validatedUiContent.app.uploadResult}
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
