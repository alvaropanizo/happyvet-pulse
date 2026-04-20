import { useEffect, useState } from "react";
import { Accordion, Badge, Card, Col, Form, ListGroup, Row } from "react-bootstrap";

function displayValue(fieldValue) {
  const value = fieldValue?.value;
  return value === null || value === undefined || value === "" ? "" : String(value);
}

function totalAttachments(sourceDocuments) {
  return (sourceDocuments ?? []).reduce(
    (accumulator, sourceDocument) => accumulator + (sourceDocument.attachments?.length ?? 0),
    0,
  );
}

function normalizeFieldValue(fieldValue) {
  return {
    value: fieldValue?.value ?? "",
    confidence: fieldValue?.confidence ?? 0,
    edited: fieldValue?.edited ?? false,
  };
}

function normalizeMedicalRecord(medicalRecord) {
  return {
    record_id: medicalRecord?.record_id ?? "-",
    review: {
      status: medicalRecord?.review?.status ?? "needs_review",
    },
    patient: {
      name: normalizeFieldValue(medicalRecord?.patient?.name),
      species: normalizeFieldValue(medicalRecord?.patient?.species),
      breed: normalizeFieldValue(medicalRecord?.patient?.breed),
      sex: normalizeFieldValue(medicalRecord?.patient?.sex),
      birth_date: normalizeFieldValue(medicalRecord?.patient?.birth_date),
      chip_id: normalizeFieldValue(medicalRecord?.patient?.chip_id),
      weight_kg: normalizeFieldValue(medicalRecord?.patient?.weight_kg),
    },
    owner: {
      name: normalizeFieldValue(medicalRecord?.owner?.name),
      address: normalizeFieldValue(medicalRecord?.owner?.address),
    },
    timeline: (medicalRecord?.timeline ?? []).map((event, index) => ({
      event_id: event?.event_id ?? `event_${index + 1}`,
      title: event?.title ?? "",
      date: event?.date ?? "",
      clinic: event?.clinic ?? "",
    })),
    problem_list: (medicalRecord?.problem_list ?? []).map((problem, index) => ({
      problem_id: problem?.problem_id ?? `problem_${index + 1}`,
      name: problem?.name ?? "",
      status: problem?.status ?? "active",
    })),
    reminders: (medicalRecord?.reminders ?? []).map((reminder, index) => ({
      reminder_id: reminder?.reminder_id ?? `reminder_${index + 1}`,
      label: reminder?.label ?? "",
      status: reminder?.status ?? "pending",
      due_date: reminder?.due_date ?? "",
    })),
    source_documents: (medicalRecord?.source_documents ?? []).map((sourceDocument, index) => ({
      document_id: sourceDocument?.document_id ?? `doc_${index + 1}`,
      filename: sourceDocument?.filename ?? "",
      source_type: sourceDocument?.source_type ?? "",
      attachments: sourceDocument?.attachments ?? [],
      raw_text: sourceDocument?.raw_text ?? "",
    })),
  };
}

function EditableFieldValue({ label, fieldValue, type = "text", onChange }) {
  return (
    <Form.Group as={Col}>
      <Form.Label className="mb-1">{label}</Form.Label>
      <Form.Control type={type} value={displayValue(fieldValue)} onChange={(event) => onChange(event.target.value)} />
    </Form.Group>
  );
}

function SummaryMetric({ label, value }) {
  return (
    <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
      <span className="hv-info-text">{label}</span>
      <Badge bg="secondary">{value}</Badge>
    </ListGroup.Item>
  );
}

function EmptySectionValue({ message = "-" }) {
  return <p className="mb-0 hv-info-text">{message}</p>;
}

function EditableTimelineItem({ event, content, onChange }) {
  return (
    <ListGroup.Item>
      <Row className="g-2">
        <Form.Group as={Col} md={6}>
          <Form.Label className="mb-1">Title</Form.Label>
          <Form.Control type="text" value={event.title} onChange={(e) => onChange("title", e.target.value)} />
        </Form.Group>
        <Form.Group as={Col} md={3}>
          <Form.Label className="mb-1">Date</Form.Label>
          <Form.Control type="date" value={event.date} onChange={(e) => onChange("date", e.target.value)} />
        </Form.Group>
        <Form.Group as={Col} md={3}>
          <Form.Label className="mb-1">{content.clinicLabel}</Form.Label>
          <Form.Control type="text" value={event.clinic} onChange={(e) => onChange("clinic", e.target.value)} />
        </Form.Group>
      </Row>
    </ListGroup.Item>
  );
}

function EditableProblemItem({ problem, onChange }) {
  return (
    <ListGroup.Item>
      <Row className="g-2 align-items-end">
        <Form.Group as={Col} md={8}>
          <Form.Label className="mb-1">Problem</Form.Label>
          <Form.Control type="text" value={problem.name} onChange={(e) => onChange("name", e.target.value)} />
        </Form.Group>
        <Form.Group as={Col} md={4}>
          <Form.Label className="mb-1">Status</Form.Label>
          <Form.Select value={problem.status} onChange={(e) => onChange("status", e.target.value)}>
            <option value="active">active</option>
            <option value="resolved">resolved</option>
            <option value="recurrent">recurrent</option>
          </Form.Select>
        </Form.Group>
      </Row>
    </ListGroup.Item>
  );
}

function EditableReminderItem({ reminder, content, onChange }) {
  return (
    <ListGroup.Item>
      <Row className="g-2 align-items-end">
        <Form.Group as={Col} md={5}>
          <Form.Label className="mb-1">Label</Form.Label>
          <Form.Control type="text" value={reminder.label} onChange={(e) => onChange("label", e.target.value)} />
        </Form.Group>
        <Form.Group as={Col} md={3}>
          <Form.Label className="mb-1">{content.dueDateLabel}</Form.Label>
          <Form.Control type="date" value={reminder.due_date} onChange={(e) => onChange("due_date", e.target.value)} />
        </Form.Group>
        <Form.Group as={Col} md={4}>
          <Form.Label className="mb-1">Status</Form.Label>
          <Form.Select value={reminder.status} onChange={(e) => onChange("status", e.target.value)}>
            <option value="pending">pending</option>
            <option value="done">done</option>
          </Form.Select>
        </Form.Group>
      </Row>
    </ListGroup.Item>
  );
}

function getRawExtractedText(sourceDocuments) {
  return sourceDocuments?.[0]?.raw_text ?? "";
}

function ensureSourceDocument(sourceDocuments) {
  if ((sourceDocuments ?? []).length > 0) return [...sourceDocuments];
  return [{ document_id: "doc_1", filename: "", source_type: "", attachments: [], raw_text: "" }];
}

function MedicalRecordPanel({ medicalRecord, content }) {
  const [draft, setDraft] = useState(() => normalizeMedicalRecord(medicalRecord));

  useEffect(() => {
    setDraft(normalizeMedicalRecord(medicalRecord));
  }, [medicalRecord]);

  const recentTimeline = draft.timeline.slice(0, 3);
  const rawExtractedText = getRawExtractedText(draft.source_documents);

  const updateFieldValue = (section, field, value) => {
    setDraft((previous) => ({
      ...previous,
      [section]: {
        ...previous[section],
        [field]: {
          ...previous[section][field],
          value,
          edited: true,
        },
      },
    }));
  };

  const updateTimelineField = (index, field, value) => {
    setDraft((previous) => ({
      ...previous,
      timeline: previous.timeline.map((event, eventIndex) =>
        eventIndex === index ? { ...event, [field]: value } : event,
      ),
    }));
  };

  const updateProblemField = (index, field, value) => {
    setDraft((previous) => ({
      ...previous,
      problem_list: previous.problem_list.map((problem, problemIndex) =>
        problemIndex === index ? { ...problem, [field]: value } : problem,
      ),
    }));
  };

  const updateReminderField = (index, field, value) => {
    setDraft((previous) => ({
      ...previous,
      reminders: previous.reminders.map((reminder, reminderIndex) =>
        reminderIndex === index ? { ...reminder, [field]: value } : reminder,
      ),
    }));
  };

  const updateRawText = (value) => {
    setDraft((previous) => {
      const sourceDocuments = ensureSourceDocument(previous.source_documents);
      sourceDocuments[0] = { ...sourceDocuments[0], raw_text: value };
      return { ...previous, source_documents: sourceDocuments };
    });
  };

  return (
    <Card className="hv-card hv-card-spaced">
      <Card.Body>
        <h2 className="h6 hv-title">
          {content.title}
        </h2>

        <Form className="mt-3">
          <Row className="g-3 mb-3">
            <Form.Group as={Col} md={7}>
              <Form.Label className="mb-1">{content.recordIdLabel}</Form.Label>
              <Form.Control
                type="text"
                value={draft.record_id}
                onChange={(event) => setDraft((previous) => ({ ...previous, record_id: event.target.value }))}
              />
            </Form.Group>
            <Form.Group as={Col} md={5}>
              <Form.Label className="mb-1">{content.reviewStatusLabel}</Form.Label>
              <Form.Select
                value={draft.review.status}
                aria-label={content.reviewStatusLabel}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    review: { ...previous.review, status: event.target.value },
                  }))
                }
              >
                <option value="needs_review">needs_review</option>
                <option value="in_review">in_review</option>
                <option value="approved">approved</option>
              </Form.Select>
            </Form.Group>
          </Row>

          <Accordion defaultActiveKey={["patient", "owner", "summary"]} alwaysOpen>
            <Accordion.Item eventKey="patient">
              <Accordion.Header>{content.patientSectionTitle}</Accordion.Header>
              <Accordion.Body>
                <Row className="g-3">
                  <EditableFieldValue
                    label={content.patientNameLabel}
                    fieldValue={draft.patient.name}
                    onChange={(value) => updateFieldValue("patient", "name", value)}
                  />
                  <EditableFieldValue
                    label={content.speciesLabel}
                    fieldValue={draft.patient.species}
                    onChange={(value) => updateFieldValue("patient", "species", value)}
                  />
                  <EditableFieldValue
                    label={content.breedLabel}
                    fieldValue={draft.patient.breed}
                    onChange={(value) => updateFieldValue("patient", "breed", value)}
                  />
                  <EditableFieldValue
                    label={content.sexLabel}
                    fieldValue={draft.patient.sex}
                    onChange={(value) => updateFieldValue("patient", "sex", value)}
                  />
                  <EditableFieldValue
                    label={content.chipLabel}
                    fieldValue={draft.patient.chip_id}
                    onChange={(value) => updateFieldValue("patient", "chip_id", value)}
                  />
                  <EditableFieldValue
                    label="Birth date:"
                    fieldValue={draft.patient.birth_date}
                    type="date"
                    onChange={(value) => updateFieldValue("patient", "birth_date", value)}
                  />
                  <EditableFieldValue
                    label="Weight (kg):"
                    fieldValue={draft.patient.weight_kg}
                    type="number"
                    onChange={(value) => updateFieldValue("patient", "weight_kg", value)}
                  />
                </Row>
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="owner">
              <Accordion.Header>{content.ownerSectionTitle}</Accordion.Header>
              <Accordion.Body>
                <Row className="g-3">
                  <EditableFieldValue
                    label={content.ownerNameLabel}
                    fieldValue={draft.owner.name}
                    onChange={(value) => updateFieldValue("owner", "name", value)}
                  />
                  <EditableFieldValue
                    label={content.ownerAddressLabel}
                    fieldValue={draft.owner.address}
                    onChange={(value) => updateFieldValue("owner", "address", value)}
                  />
                </Row>
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="summary">
              <Accordion.Header>{content.summarySectionTitle}</Accordion.Header>
              <Accordion.Body>
                <ListGroup variant="flush">
                  <SummaryMetric label={content.timelineCountLabel} value={draft.timeline.length} />
                  <SummaryMetric label={content.problemsCountLabel} value={draft.problem_list.length} />
                  <SummaryMetric label={content.remindersCountLabel} value={draft.reminders.length} />
                  <SummaryMetric label={content.sourceDocsCountLabel} value={draft.source_documents.length} />
                  <SummaryMetric
                    label={content.attachmentsCountLabel}
                    value={totalAttachments(draft.source_documents)}
                  />
                </ListGroup>
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="timeline">
              <Accordion.Header>{content.recentTimelineTitle}</Accordion.Header>
              <Accordion.Body>
                {recentTimeline.length === 0 ? (
                  <EmptySectionValue />
                ) : (
                  <ListGroup>
                    {recentTimeline.map((event, index) => (
                      <EditableTimelineItem
                        key={event.event_id}
                        event={event}
                        content={content}
                        onChange={(field, value) => updateTimelineField(index, field, value)}
                      />
                    ))}
                  </ListGroup>
                )}
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="problems">
              <Accordion.Header>{content.problemListTitle}</Accordion.Header>
              <Accordion.Body>
                {draft.problem_list.length === 0 ? (
                  <EmptySectionValue />
                ) : (
                  <ListGroup>
                    {draft.problem_list.map((problem, index) => (
                      <EditableProblemItem
                        key={problem.problem_id}
                        problem={problem}
                        onChange={(field, value) => updateProblemField(index, field, value)}
                      />
                    ))}
                  </ListGroup>
                )}
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="reminders">
              <Accordion.Header>{content.remindersTitle}</Accordion.Header>
              <Accordion.Body>
                {draft.reminders.length === 0 ? (
                  <EmptySectionValue />
                ) : (
                  <ListGroup>
                    {draft.reminders.map((reminder, index) => (
                      <EditableReminderItem
                        key={reminder.reminder_id}
                        reminder={reminder}
                        content={content}
                        onChange={(field, value) => updateReminderField(index, field, value)}
                      />
                    ))}
                  </ListGroup>
                )}
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Form>

        <details className="mt-3">
          <summary className="hv-title hv-summary">
            {content.rawExtractedTextTitle}
          </summary>
          <Form.Group className="mt-2">
            <Form.Control
              as="textarea"
              rows={8}
              value={rawExtractedText}
              onChange={(event) => updateRawText(event.target.value)}
              placeholder={content.rawExtractedTextEmpty}
            />
          </Form.Group>
        </details>
      </Card.Body>
    </Card>
  );
}

export default MedicalRecordPanel;
