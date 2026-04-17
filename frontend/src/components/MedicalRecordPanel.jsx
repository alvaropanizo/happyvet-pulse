import { Card } from "react-bootstrap";

import { previewStyles, sharedStyles } from "../styles/uiTheme";

function displayValue(fieldValue) {
  return fieldValue?.value ?? "-";
}

function totalAttachments(sourceDocuments) {
  return sourceDocuments.reduce(
    (accumulator, sourceDocument) => accumulator + (sourceDocument.attachments?.length ?? 0),
    0,
  );
}

function getRawExtractedText(sourceDocuments) {
  return sourceDocuments?.[0]?.raw_text?.trim() ?? "";
}

function splitRawTextIntoParagraphs(rawText) {
  return rawText
    .split(/\n{2,}/)
    .map((chunk) => chunk.split("\n").map((line) => line.trim()).filter(Boolean).join("\n"))
    .filter(Boolean);
}

function MedicalRecordPanel({ medicalRecord, content }) {
  const recentTimeline = medicalRecord.timeline.slice(0, 3);
  const rawExtractedText = getRawExtractedText(medicalRecord.source_documents);
  const rawParagraphs = splitRawTextIntoParagraphs(rawExtractedText);

  return (
    <Card style={{ ...sharedStyles.baseCard, marginTop: "16px" }}>
      <Card.Body>
        <h2 className="h6" style={sharedStyles.panelTitle}>
          {content.title}
        </h2>

        <p className="mb-1" style={previewStyles.infoText}>
          <strong>{content.recordIdLabel}</strong> {medicalRecord.record_id}
        </p>
        <p className="mb-1" style={previewStyles.infoText}>
          <strong>{content.reviewStatusLabel}</strong> {medicalRecord.review.status}
        </p>

        <h3 className="h6 mt-3 mb-2" style={sharedStyles.panelTitle}>
          {content.patientSectionTitle}
        </h3>
        <p className="mb-1" style={previewStyles.infoText}>
          <strong>{content.patientNameLabel}</strong> {displayValue(medicalRecord.patient.name)}
        </p>
        <p className="mb-1" style={previewStyles.infoText}>
          <strong>{content.speciesLabel}</strong> {displayValue(medicalRecord.patient.species)}
        </p>
        <p className="mb-1" style={previewStyles.infoText}>
          <strong>{content.breedLabel}</strong> {displayValue(medicalRecord.patient.breed)}
        </p>
        <p className="mb-1" style={previewStyles.infoText}>
          <strong>{content.sexLabel}</strong> {displayValue(medicalRecord.patient.sex)}
        </p>
        <p className="mb-0" style={previewStyles.infoText}>
          <strong>{content.chipLabel}</strong> {displayValue(medicalRecord.patient.chip_id)}
        </p>

        <h3 className="h6 mt-3 mb-2" style={sharedStyles.panelTitle}>
          {content.ownerSectionTitle}
        </h3>
        <p className="mb-1" style={previewStyles.infoText}>
          <strong>{content.ownerNameLabel}</strong> {displayValue(medicalRecord.owner.name)}
        </p>
        <p className="mb-0" style={previewStyles.infoText}>
          <strong>{content.ownerAddressLabel}</strong> {displayValue(medicalRecord.owner.address)}
        </p>

        <h3 className="h6 mt-3 mb-2" style={sharedStyles.panelTitle}>
          {content.summarySectionTitle}
        </h3>
        <p className="mb-1" style={previewStyles.infoText}>
          <strong>{content.timelineCountLabel}</strong> {medicalRecord.timeline.length}
        </p>
        <p className="mb-1" style={previewStyles.infoText}>
          <strong>{content.problemsCountLabel}</strong> {medicalRecord.problem_list.length}
        </p>
        <p className="mb-0" style={previewStyles.infoText}>
          <strong>{content.remindersCountLabel}</strong> {medicalRecord.reminders.length}
        </p>
        <p className="mb-1" style={previewStyles.infoText}>
          <strong>{content.sourceDocsCountLabel}</strong> {medicalRecord.source_documents.length}
        </p>
        <p className="mb-0" style={previewStyles.infoText}>
          <strong>{content.attachmentsCountLabel}</strong>{" "}
          {totalAttachments(medicalRecord.source_documents)}
        </p>

        <h3 className="h6 mt-3 mb-2" style={sharedStyles.panelTitle}>
          {content.recentTimelineTitle}
        </h3>
        {recentTimeline.length === 0 ? (
          <p className="mb-0" style={previewStyles.infoText}>
            -
          </p>
        ) : (
          <ul className="mb-0 ps-3">
            {recentTimeline.map((event) => (
              <li key={event.event_id} style={{ ...previewStyles.infoText, marginBottom: "8px" }}>
                <strong>{event.date ?? "-"}</strong> - {event.title ?? "-"}
                <br />
                <span>
                  {content.clinicLabel} {event.clinic ?? "-"}
                </span>
              </li>
            ))}
          </ul>
        )}

        <h3 className="h6 mt-3 mb-2" style={sharedStyles.panelTitle}>
          {content.problemListTitle}
        </h3>
        {medicalRecord.problem_list.length === 0 ? (
          <p className="mb-0" style={previewStyles.infoText}>
            -
          </p>
        ) : (
          <ul className="mb-0 ps-3">
            {medicalRecord.problem_list.map((problem) => (
              <li
                key={problem.problem_id}
                style={{ ...previewStyles.infoText, marginBottom: "8px" }}
              >
                <strong>{problem.name}</strong> ({content.statusLabel} {problem.status})
              </li>
            ))}
          </ul>
        )}

        <h3 className="h6 mt-3 mb-2" style={sharedStyles.panelTitle}>
          {content.remindersTitle}
        </h3>
        {medicalRecord.reminders.length === 0 ? (
          <p className="mb-0" style={previewStyles.infoText}>
            -
          </p>
        ) : (
          <ul className="mb-0 ps-3">
            {medicalRecord.reminders.map((reminder) => (
              <li
                key={reminder.reminder_id}
                style={{ ...previewStyles.infoText, marginBottom: "8px" }}
              >
                <strong>{reminder.label}</strong> ({content.statusLabel} {reminder.status})
                <br />
                <span>
                  {content.dueDateLabel} {reminder.due_date ?? "-"}
                </span>
              </li>
            ))}
          </ul>
        )}

        <details className="mt-3">
          <summary style={{ ...sharedStyles.panelTitle, cursor: "pointer" }}>
            {content.rawExtractedTextTitle}
          </summary>
          {rawParagraphs.length === 0 ? (
            <p className="mt-2 mb-0" style={previewStyles.infoText}>
              {content.rawExtractedTextEmpty}
            </p>
          ) : (
            <div className="mt-2 d-flex flex-column gap-2">
              {rawParagraphs.map((paragraph, index) => (
                <pre
                  key={`raw-text-${index}`}
                  style={{
                    margin: 0,
                    padding: "10px 12px",
                    borderRadius: "8px",
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #e9ecef",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontSize: "0.9rem",
                    lineHeight: 1.4,
                  }}
                >
                  {paragraph}
                </pre>
              ))}
            </div>
          )}
        </details>
      </Card.Body>
    </Card>
  );
}

export default MedicalRecordPanel;
