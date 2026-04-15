import { Card } from "react-bootstrap";

import { previewStyles, sharedStyles } from "../styles/uiTheme";

function RecentDocumentsPanel({ documents, content }) {
  return (
    <Card style={{ ...sharedStyles.baseCard, height: "100%" }}>
      <Card.Body>
        <h2 className="h6" style={sharedStyles.panelTitle}>
          {content.title}
        </h2>

        {documents.length === 0 ? (
          <p className="mb-0" style={previewStyles.infoText}>
            {content.emptyState}
          </p>
        ) : (
          <ul className="mb-0 ps-3">
            {documents.map((fileName, index) => (
              <li key={`${fileName}-${index}`} style={{ ...previewStyles.infoText, marginBottom: "6px" }}>
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
