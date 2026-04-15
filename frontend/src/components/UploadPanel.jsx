import { useRef, useState } from "react";
import { Button, Card } from "react-bootstrap";

import { previewStyles, sharedStyles, uploadStyles } from "../styles/uiTheme";

function UploadPanel({ onFileSelected, selectedFileName, title, content, isUploading, uploadError }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFile = (file) => {
    if (!file) return;
    onFileSelected(file);
  };

  return (
    <section>
      <h1 style={sharedStyles.mainTitle}>{title}</h1>

      <Card
        style={uploadStyles.getDropzoneCard(isDragging)}
        onClick={openFilePicker}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFile(event.dataTransfer.files?.[0]);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
      >
        <Card.Body className="text-center py-5 px-4">
          <i
            className="bi bi-cloud-arrow-up-fill"
            style={uploadStyles.uploadIcon}
            aria-hidden="true"
          />
          <h2 className="h5 mt-3 mb-2" style={{ color: uploadStyles.uploadIcon.color }}>
            {content.dropInstruction}
          </h2>
          <p className="mb-4" style={uploadStyles.bodyText}>
            {content.supportNote}
          </p>

          <Button
            type="button"
            style={uploadStyles.button}
            onClick={(event) => {
              event.stopPropagation();
              openFilePicker();
            }}
          >
            {content.selectButton}
          </Button>

          {selectedFileName ? (
            <p className="mt-3 mb-0" style={uploadStyles.bodyText}>
              {content.selectedPrefix} <strong>{selectedFileName}</strong>
            </p>
          ) : null}

          {isUploading ? (
            <p className="mt-2 mb-0" style={uploadStyles.bodyText}>
              {content.uploadingMessage}
            </p>
          ) : null}

          {uploadError ? (
            <p className="mt-2 mb-0" style={previewStyles.errorText}>
              {content.uploadErrorPrefix} {uploadError}
            </p>
          ) : null}
        </Card.Body>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={(event) => handleFile(event.target.files?.[0])}
        aria-label={content.fileInputAriaLabel}
      />
    </section>
  );
}

export default UploadPanel;
