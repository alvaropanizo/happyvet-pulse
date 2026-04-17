import { useRef, useState } from "react";
import { Button, Card } from "react-bootstrap";

import { sharedStyles, uploadStyles } from "../styles/uiTheme";

function UploadPanel({
  onFileSelected,
  title,
  content,
}) {
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
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            width="36"
            height="36"
            fill={uploadStyles.uploadIcon.color}
            style={uploadStyles.uploadIcon}
          >
            <path d="M4.406 9.342A5.53 5.53 0 0 1 8 4.5a5.53 5.53 0 0 1 3.594 4.842A2.5 2.5 0 1 1 11.5 14h-7a2.5 2.5 0 1 1-.094-4.658zM8.5 7.5a.5.5 0 0 0-1 0v3.293L6.354 9.646a.5.5 0 1 0-.708.708l2 2 .007.007.007.006a.498.498 0 0 0 .7-.006l2-2a.5.5 0 0 0-.708-.708L8.5 10.793V7.5z" />
          </svg>
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
