import { Card } from "react-bootstrap";

import { previewStyles, sharedStyles } from "../styles/uiTheme";

function UploadResultCard({ metadata, content }) {
  if (!metadata) return null;

  return (
    <Card style={{ ...sharedStyles.baseCard, marginTop: "16px" }}>
      <Card.Body>
        <h2 className="h6" style={sharedStyles.panelTitle}>
          {content.title}
        </h2>
        <p className="mb-1" style={previewStyles.infoText}>
          <strong>{content.fileNameLabel}</strong> {metadata.filename}
        </p>
        <p className="mb-1" style={previewStyles.infoText}>
          <strong>{content.contentTypeLabel}</strong> {metadata.content_type}
        </p>
        <p className="mb-1" style={previewStyles.infoText}>
          <strong>{content.fileSizeLabel}</strong> {metadata.size_bytes}
        </p>
        <p className="mb-0" style={previewStyles.infoText}>
          <strong>{content.textPreviewLabel}</strong> {metadata.text_preview || "-"}
        </p>
      </Card.Body>
    </Card>
  );
}

export default UploadResultCard;
