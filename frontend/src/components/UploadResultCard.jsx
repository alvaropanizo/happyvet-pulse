import { Card } from "react-bootstrap";

function UploadResultCard({ metadata, content }) {
  if (!metadata) return null;

  return (
    <Card className="hv-card hv-card-spaced">
      <Card.Body>
        <h2 className="h6 hv-title">
          {content.title}
        </h2>
        <p className="mb-1 hv-info-text">
          <strong>{content.fileNameLabel}</strong> {metadata.filename}
        </p>
        <p className="mb-1 hv-info-text">
          <strong>{content.contentTypeLabel}</strong> {metadata.content_type}
        </p>
        <p className="mb-1 hv-info-text">
          <strong>{content.fileSizeLabel}</strong> {metadata.size_bytes}
        </p>
        <p className="mb-0 hv-info-text">
          <strong>{content.textPreviewLabel}</strong> {metadata.text_preview || "-"}
        </p>
      </Card.Body>
    </Card>
  );
}

export default UploadResultCard;
