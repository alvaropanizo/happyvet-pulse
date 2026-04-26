import { useEffect, useRef } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { Minus } from "lucide-react";

import { isRequiredTimelineField } from "../../../contracts/uiRequiredFields";
import { TIMELINE_EVENT_TYPE_OPTIONS } from "../constants/fieldOptions";
import {
  attachmentNamesToText,
  diagnosesToText,
  parseDiagnosesText,
  parseTestsText,
  parseTreatmentsText,
  testsToText,
  toTimelineFieldValue,
  treatmentsToText,
} from "../utils/timelineUtils";

function TimelineEventForm({
  event,
  content,
  onChange,
  onRemove,
  autoFocus = false,
  onUploadAttachments,
  onFieldApprove,
  getFieldStatus,
  EditableFieldComponent,
}) {
  const formRef = useRef(null);
  const timelineFieldValue = (fieldKey, value) => toTimelineFieldValue(value, getFieldStatus?.(fieldKey));

  useEffect(() => {
    if (!autoFocus || !formRef.current) return;
    formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    const firstInput = formRef.current.querySelector("input, select, textarea");
    firstInput?.focus();
  }, [autoFocus]);

  return (
    <div ref={formRef} className="border rounded p-3 mb-3">
      <Row className="g-3 mt-1">
        <EditableFieldComponent
          label="Event type"
          fieldValue={timelineFieldValue("event_type", event.event_type)}
          options={TIMELINE_EVENT_TYPE_OPTIONS}
          fieldPath={`timeline.${event.event_id}.event_type`}
          isRequired={isRequiredTimelineField("event_type")}
          onApprove={() => onFieldApprove?.("event_type")}
          onChange={(value) => onChange("event_type", value)}
        />
        <EditableFieldComponent
          label="Date"
          fieldValue={timelineFieldValue("date", event.date)}
          type="date"
          fieldPath={`timeline.${event.event_id}.date`}
          isRequired={isRequiredTimelineField("date")}
          onApprove={() => onFieldApprove?.("date")}
          onChange={(value) => onChange("date", value)}
        />
        <EditableFieldComponent
          label={content.clinicLabel}
          fieldValue={timelineFieldValue("clinic", event.clinic)}
          fieldPath={`timeline.${event.event_id}.clinic`}
          isRequired={isRequiredTimelineField("clinic")}
          onApprove={() => onFieldApprove?.("clinic")}
          onChange={(value) => onChange("clinic", value)}
        />
        <EditableFieldComponent
          label="Title"
          fieldValue={timelineFieldValue("title", event.title)}
          multiline
          fieldPath={`timeline.${event.event_id}.title`}
          isRequired={isRequiredTimelineField("title")}
          onApprove={() => onFieldApprove?.("title")}
          onChange={(value) => onChange("title", value)}
        />
        <EditableFieldComponent
          label="Anamnesis"
          fieldValue={timelineFieldValue("anamnesis", event.anamnesis)}
          multiline
          rows={3}
          fieldPath={`timeline.${event.event_id}.anamnesis`}
          onApprove={() => onFieldApprove?.("anamnesis")}
          onChange={(value) => onChange("anamnesis", value)}
        />
        <EditableFieldComponent
          label="Assessment"
          fieldValue={timelineFieldValue("assessment", (event.assessment ?? []).join(", "))}
          multiline
          rows={2}
          fieldPath={`timeline.${event.event_id}.assessment`}
          onApprove={() => onFieldApprove?.("assessment")}
          onChange={(value) =>
            onChange(
              "assessment",
              value
                .split(",")
                .map((entry) => entry.trim())
                .filter(Boolean),
            )
          }
        />
        <EditableFieldComponent
          label="Diagnoses"
          fieldValue={timelineFieldValue("diagnoses", diagnosesToText(event.diagnoses))}
          multiline
          rows={3}
          md={12}
          fieldPath={`timeline.${event.event_id}.diagnoses`}
          onApprove={() => onFieldApprove?.("diagnoses")}
          onChange={(value) => onChange("diagnoses", parseDiagnosesText(value))}
        />
        <EditableFieldComponent
          label="Treatments"
          fieldValue={timelineFieldValue("treatments", treatmentsToText(event.treatments))}
          multiline
          rows={3}
          md={12}
          fieldPath={`timeline.${event.event_id}.treatments`}
          onApprove={() => onFieldApprove?.("treatments")}
          onChange={(value) => onChange("treatments", parseTreatmentsText(value))}
        />
        <EditableFieldComponent
          label="Tests"
          fieldValue={timelineFieldValue("tests", testsToText(event.tests))}
          multiline
          rows={3}
          md={12}
          fieldPath={`timeline.${event.event_id}.tests`}
          onApprove={() => onFieldApprove?.("tests")}
          onChange={(value) => onChange("tests", parseTestsText(value))}
        />
        <Form.Group as={Col} md={12}>
          <Form.Label className="mb-1 hv-form-field-label">Attached files</Form.Label>
          <Form.Control
            as="textarea"
            rows={Math.max(2, Math.min(6, (event.attachments ?? []).length || 2))}
            className="hv-field-input-with-action hv-textarea-fixed"
            value={attachmentNamesToText(event.attachments)}
            readOnly
            placeholder="No files attached"
          />
        </Form.Group>
        <Form.Group as={Col} md={12}>
          <Form.Label className="mb-1 hv-form-field-label">Attachments upload</Form.Label>
          <Form.Control
            type="file"
            multiple
            onChange={(fileEvent) => {
              const files = Array.from(fileEvent.target.files ?? []);
              if (files.length > 0) {
                onUploadAttachments(files);
              }
              fileEvent.target.value = "";
            }}
          />
        </Form.Group>
      </Row>
      <div className="d-flex justify-content-end mt-3">
        <button type="button" className="hv-timeline-remove-btn" onClick={onRemove} title="Remove this visit/event">
          <Minus size={16} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

export default TimelineEventForm;
