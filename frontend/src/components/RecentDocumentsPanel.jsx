import { Card } from "react-bootstrap";

function RecentDocumentsPanel({ documents, content }) {
  return (
    <Card className="hv-card h-100">
      <Card.Body>
        <h2 className="h6 hv-title">
          {content.title}
        </h2>

        {documents.length === 0 ? (
          <p className="mb-0 hv-info-text">
            {content.emptyState}
          </p>
        ) : (
          <ul className="mb-0 ps-3">
            {documents.map((fileName, index) => (
              <li key={`${fileName}-${index}`} className="hv-info-text mb-1">
                {fileName}
              </li>
            ))}
          </ul>
        )}
      </Card.Body>
    </Card>
  );
}

export default RecentDocumentsPanel;
