import { useState } from "react";
import { Container } from "react-bootstrap";

import DocumentPreview from "./components/DocumentPreview";
import RecentDocumentsPanel from "./components/RecentDocumentsPanel";
import UploadPanel from "./components/UploadPanel";
import uiContent from "./data/uiContent.json";
import { sharedStyles, uiTheme } from "./styles/uiTheme";
import { validateUiContent } from "./utils/validateUiContent";

const validatedUiContent = validateUiContent(uiContent);

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);

  const handleFileSelected = (file) => {
    setSelectedFile(file);
    setUploadedDocuments((previous) => [file.name, ...previous.filter((name) => name !== file.name)]);
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
