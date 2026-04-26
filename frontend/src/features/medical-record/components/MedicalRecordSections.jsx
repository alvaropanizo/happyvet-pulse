import { Check, CheckSquare, ChevronDown, ChevronUp, OctagonAlert, Plus, ShieldCheck, Square, Trash2 } from "lucide-react";
import { Accordion, ListGroup, Row } from "react-bootstrap";

import { isRequiredField } from "../../../contracts/uiRequiredFields";
import { SEX_OPTIONS, SPECIES_OPTIONS } from "../constants/fieldOptions";

export function PatientSection({
  content,
  draft,
  patientSectionStatus,
  patientSectionIcon,
  sparklingSections,
  SectionHeaderComponent,
  EditableFieldComponent,
  approveField,
  updateFieldValue,
}) {
  return (
    <Accordion.Item eventKey="patient" className={`hv-main-section hv-main-section--${patientSectionStatus}`}>
      <Accordion.Header>
        <SectionHeaderComponent
          title={content.patientSectionTitle}
          Icon={patientSectionIcon}
          sectionStatus={patientSectionStatus}
          sparkling={sparklingSections.includes("patient")}
        />
      </Accordion.Header>
      <Accordion.Body>
        <Row className="g-3">
          <EditableFieldComponent
            label={content.patientNameLabel}
            fieldValue={draft.patient.name}
            fieldPath="patient.name"
            isRequired={isRequiredField("patient.name")}
            onApprove={() => approveField("patient", "name")}
            onChange={(value) => updateFieldValue("patient", "name", value)}
          />
          <EditableFieldComponent
            label={content.speciesLabel}
            fieldValue={draft.patient.species}
            options={SPECIES_OPTIONS}
            fieldPath="patient.species"
            isRequired={isRequiredField("patient.species")}
            onApprove={() => approveField("patient", "species")}
            onChange={(value) => updateFieldValue("patient", "species", value)}
          />
          <EditableFieldComponent
            label={content.breedLabel}
            fieldValue={draft.patient.breed}
            fieldPath="patient.breed"
            isRequired={isRequiredField("patient.breed")}
            onApprove={() => approveField("patient", "breed")}
            onChange={(value) => updateFieldValue("patient", "breed", value)}
          />
          <EditableFieldComponent
            label={content.sexLabel}
            fieldValue={draft.patient.sex}
            options={SEX_OPTIONS}
            fieldPath="patient.sex"
            isRequired={isRequiredField("patient.sex")}
            onApprove={() => approveField("patient", "sex")}
            onChange={(value) => updateFieldValue("patient", "sex", value)}
          />
          <EditableFieldComponent
            label={content.chipLabel}
            fieldValue={draft.patient.chip_id}
            fieldPath="patient.chip_id"
            isRequired={isRequiredField("patient.chip_id")}
            onApprove={() => approveField("patient", "chip_id")}
            onChange={(value) => updateFieldValue("patient", "chip_id", value)}
          />
          <EditableFieldComponent
            label="Birth date:"
            fieldValue={draft.patient.birth_date}
            type="date"
            fieldPath="patient.birth_date"
            isRequired={isRequiredField("patient.birth_date")}
            onApprove={() => approveField("patient", "birth_date")}
            onChange={(value) => updateFieldValue("patient", "birth_date", value)}
          />
          <EditableFieldComponent
            label="Weight (kg):"
            fieldValue={draft.patient.weight_kg}
            type="number"
            md={4}
            fieldPath="patient.weight_kg"
            isRequired={isRequiredField("patient.weight_kg")}
            onApprove={() => approveField("patient", "weight_kg")}
            onChange={(value) => updateFieldValue("patient", "weight_kg", value)}
          />
        </Row>
      </Accordion.Body>
    </Accordion.Item>
  );
}

export function OwnerSection({
  content,
  draft,
  ownerSectionStatus,
  ownerSectionIcon,
  sparklingSections,
  SectionHeaderComponent,
  EditableFieldComponent,
  approveField,
  updateFieldValue,
}) {
  return (
    <Accordion.Item eventKey="owner" className={`hv-main-section hv-main-section--${ownerSectionStatus}`}>
      <Accordion.Header>
        <SectionHeaderComponent
          title={content.ownerSectionTitle}
          Icon={ownerSectionIcon}
          sectionStatus={ownerSectionStatus}
          sparkling={sparklingSections.includes("owner")}
        />
      </Accordion.Header>
      <Accordion.Body>
        <Row className="g-3">
          <EditableFieldComponent
            label={content.ownerNameLabel}
            fieldValue={draft.owner.name}
            fieldPath="owner.name"
            isRequired={isRequiredField("owner.name")}
            onApprove={() => approveField("owner", "name")}
            onChange={(value) => updateFieldValue("owner", "name", value)}
          />
          <EditableFieldComponent
            label="Owner surname:"
            fieldValue={draft.owner.surname}
            fieldPath="owner.surname"
            isRequired={isRequiredField("owner.surname")}
            onApprove={() => approveField("owner", "surname")}
            onChange={(value) => updateFieldValue("owner", "surname", value)}
          />
          <EditableFieldComponent
            label="Owner phone number:"
            fieldValue={draft.owner.phone_number}
            fieldPath="owner.phone_number"
            isRequired={isRequiredField("owner.phone_number")}
            onApprove={() => approveField("owner", "phone_number")}
            onChange={(value) => updateFieldValue("owner", "phone_number", value)}
          />
          <EditableFieldComponent
            label="Owner email:"
            fieldValue={draft.owner.email}
            fieldPath="owner.email"
            isRequired={isRequiredField("owner.email")}
            onApprove={() => approveField("owner", "email")}
            onChange={(value) => updateFieldValue("owner", "email", value)}
          />
          <EditableFieldComponent
            label={content.ownerAddressLabel}
            fieldValue={draft.owner.address}
            multiline
            rows={3}
            md={12}
            fieldPath="owner.address"
            onApprove={() => approveField("owner", "address")}
            resizable
            onChange={(value) => updateFieldValue("owner", "address", value)}
          />
        </Row>
      </Accordion.Body>
    </Accordion.Item>
  );
}

export function OverviewSection({
  content,
  draft,
  SummaryMetricComponent,
  SectionHeaderComponent,
  overviewIcon,
  patientReviewedCount,
  patientRequiredTotal,
  ownerReviewedCount,
  ownerRequiredTotal,
  historyReviewedCount,
  historyRequiredTotal,
  totalAttachments,
  totalAutoApprovedCount,
  totalManualApprovedCount,
  totalNeedsReviewCount,
  totalRequiredCount,
}) {
  return (
    <Accordion.Item eventKey="overview">
      <Accordion.Header>
        <SectionHeaderComponent title="Overview" Icon={overviewIcon} sectionStatus="approved" showWarning={false} />
      </Accordion.Header>
      <Accordion.Body>
        <h6 className="hv-title mb-2">{content.summarySectionTitle}</h6>
        <div className="hv-overview-summary-grid mb-3">
          <div className="hv-overview-summary-col">
            <div className="hv-overview-section-row">
              <span>Patient: {patientReviewedCount}/{patientRequiredTotal} Reviewed</span>
              {patientReviewedCount === patientRequiredTotal && patientRequiredTotal > 0 ? (
                <Check size={16} strokeWidth={2.4} className="hv-overview-section-row-icon is-approved" />
              ) : (
                <OctagonAlert size={16} strokeWidth={2.2} className="hv-overview-section-row-icon is-warning" />
              )}
            </div>
            <div className="hv-overview-section-row">
              <span>Owner: {ownerReviewedCount}/{ownerRequiredTotal} Reviewed</span>
              {ownerReviewedCount === ownerRequiredTotal && ownerRequiredTotal > 0 ? (
                <Check size={16} strokeWidth={2.4} className="hv-overview-section-row-icon is-approved" />
              ) : (
                <OctagonAlert size={16} strokeWidth={2.2} className="hv-overview-section-row-icon is-warning" />
              )}
            </div>
            <div className="hv-overview-section-row">
              <span>History: {historyReviewedCount}/{historyRequiredTotal} Reviewed</span>
              {historyReviewedCount === historyRequiredTotal && historyRequiredTotal > 0 ? (
                <Check size={16} strokeWidth={2.4} className="hv-overview-section-row-icon is-approved" />
              ) : (
                <OctagonAlert size={16} strokeWidth={2.2} className="hv-overview-section-row-icon is-warning" />
              )}
            </div>
          </div>
          <div className="hv-overview-summary-col">
            <ListGroup variant="flush">
              <SummaryMetricComponent label={content.timelineCountLabel} value={draft.timeline.length} />
              <SummaryMetricComponent label={content.sourceDocsCountLabel} value={draft.source_documents.length} />
              <SummaryMetricComponent label={content.attachmentsCountLabel} value={totalAttachments(draft.source_documents)} />
            </ListGroup>
          </div>
        </div>

        <div className="hv-overview-status-breakdown mb-4">
          <div className="hv-overview-breakdown-row">
            <span className="hv-overview-breakdown-count">{totalAutoApprovedCount}/{totalRequiredCount}</span>
            <span className="hv-overview-breakdown-label is-auto">
              <ShieldCheck size={16} strokeWidth={2.1} /> Approved automatic
            </span>
          </div>
          <div className="hv-overview-breakdown-row">
            <span className="hv-overview-breakdown-count">{totalManualApprovedCount}/{totalRequiredCount}</span>
            <span className="hv-overview-breakdown-label is-manual">
              <Check size={16} strokeWidth={2.3} /> Approved / Edited by user
            </span>
          </div>
          <div className="hv-overview-breakdown-row">
            <span className="hv-overview-breakdown-count">{totalNeedsReviewCount}/{totalRequiredCount}</span>
            <span className="hv-overview-breakdown-label is-review">
              <OctagonAlert size={16} strokeWidth={2.1} /> Needs review
            </span>
          </div>
        </div>
      </Accordion.Body>
    </Accordion.Item>
  );
}

export function TimelineSection({
  content,
  draft,
  timelineSectionStatus,
  timelineSectionIcon,
  sparklingSections,
  SectionHeaderComponent,
  TimelineEventFormComponent,
  EditableFieldComponent,
  timelineRows,
  expandedEventIds,
  selectedTimelineEventIds,
  timelineBulkMenuOpen,
  timelineBulkMenuRef,
  setTimelineBulkMenuOpen,
  addTimelineEvent,
  requestRemoveSelectedTimelineEvents,
  selectAllTimelineEvents,
  clearTimelineEventSelection,
  eventTypeIcon,
  getTimelineEventStatus,
  toggleTimelineEventExpanded,
  requestRemoveTimelineEvent,
  toggleTimelineEventSelected,
  updateTimelineField,
  newTimelineEventId,
  addTimelineAttachmentPaths,
  approveTimelineField,
  getTimelineFieldStatus,
}) {
  return (
    <Accordion.Item eventKey="timeline" className={`hv-main-section hv-main-section--${timelineSectionStatus}`}>
      <Accordion.Header>
        <SectionHeaderComponent
          title="Clinical History"
          Icon={timelineSectionIcon}
          sectionStatus={timelineSectionStatus}
          sparkling={sparklingSections.includes("timeline")}
        />
      </Accordion.Header>
      <Accordion.Body>
        {draft.timeline.length === 0 ? (
          <div className="hv-timeline-tiles">
            <button
              type="button"
              className="hv-timeline-add-btn"
              onClick={addTimelineEvent}
              title="Add a new visit or missing event"
              aria-label="Add a new visit or missing event"
            >
              <Plus size={16} strokeWidth={2.4} />
              <span>Add event</span>
            </button>
          </div>
        ) : (
          <>
            <div className="hv-timeline-list-toolbar">
              <div ref={timelineBulkMenuRef} className={`hv-timeline-bulk-select${timelineBulkMenuOpen ? " is-open" : ""}`}>
                <button
                  type="button"
                  className="hv-timeline-bulk-select-trigger"
                  title="Bulk select events"
                  aria-label="Bulk select events"
                  aria-expanded={timelineBulkMenuOpen}
                  onClick={() => setTimelineBulkMenuOpen((previous) => !previous)}
                >
                  {selectedTimelineEventIds.length > 0 ? (
                    <CheckSquare size={16} strokeWidth={2.1} />
                  ) : (
                    <Square size={16} strokeWidth={2.1} />
                  )}
                  <ChevronDown size={13} strokeWidth={2.2} />
                </button>
                {timelineBulkMenuOpen ? (
                  <div className="hv-timeline-bulk-select-menu" role="menu" aria-label="Event bulk selection menu">
                    <button
                      type="button"
                      className="hv-timeline-bulk-select-option"
                      role="menuitem"
                      onClick={selectAllTimelineEvents}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      className="hv-timeline-bulk-select-option"
                      role="menuitem"
                      onClick={clearTimelineEventSelection}
                    >
                      None
                    </button>
                  </div>
                ) : null}
              </div>
              {selectedTimelineEventIds.length > 0 ? (
                <button
                  type="button"
                  className="hv-timeline-action-btn hv-timeline-bulk-delete-btn"
                  onClick={requestRemoveSelectedTimelineEvents}
                >
                  <Trash2 size={16} strokeWidth={2.1} />
                  <span>Delete {selectedTimelineEventIds.length} events</span>
                </button>
              ) : null}
            </div>
            <div className="hv-timeline-tiles">
              {timelineRows.map((event) => {
                const isExpanded = expandedEventIds.includes(event.event_id);
                const eventStatus = getTimelineEventStatus(event);
                const EventTypeIcon = eventTypeIcon(event.event_type);
                const isSelected = selectedTimelineEventIds.includes(event.event_id);
                return (
                  <div
                    key={event.event_id}
                    className={`hv-timeline-tile hv-timeline-tile--${eventStatus}${isSelected ? " is-selected" : ""}`}
                  >
                    <div
                      className="hv-timeline-tile-header"
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleTimelineEventExpanded(event.event_id)}
                      onKeyDown={(keyboardEvent) => {
                        if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                          keyboardEvent.preventDefault();
                          toggleTimelineEventExpanded(event.event_id);
                        }
                      }}
                    >
                      <div className="hv-timeline-tile-left">
                        <span className={`hv-timeline-tile-status-icon hv-timeline-tile-status-icon--${eventStatus}`}>
                          {eventStatus === "approved" || eventStatus === "edited" ? (
                            <Check size={14} strokeWidth={2.4} />
                          ) : (
                            <OctagonAlert size={14} strokeWidth={2.2} />
                          )}
                        </span>
                        <div className="hv-timeline-tile-main">
                          <div className="hv-timeline-tile-title-row">
                            <strong className="hv-timeline-tile-title">{event.title?.trim() || event.event_id || "Event"}</strong>
                            <span
                              className={`hv-timeline-tile-type-pill hv-timeline-tile-type-pill--${
                                event.event_type || "visit"
                              }${isSelected ? " is-selected" : ""}`}
                            >
                              <EventTypeIcon size={13} strokeWidth={2.1} />
                              <span>{event.event_type || "visit"}</span>
                            </span>
                          </div>
                          <div className="hv-timeline-tile-date">Due {event.date || "no date"}</div>
                        </div>
                      </div>
                      <div className="hv-timeline-tile-actions">
                        {!isExpanded ? (
                          <>
                            <button
                              type="button"
                              className="hv-timeline-action-btn"
                              title="Delete event"
                              onClick={(clickEvent) => {
                                clickEvent.stopPropagation();
                                requestRemoveTimelineEvent(event.timelineIndex);
                              }}
                            >
                              <Trash2 size={16} strokeWidth={2.1} />
                            </button>
                            <label
                              className="hv-timeline-checkbox-wrap"
                              title="Select event"
                              onClick={(clickEvent) => clickEvent.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                className="hv-timeline-checkbox"
                                checked={isSelected}
                                onChange={() => toggleTimelineEventSelected(event.event_id)}
                                aria-label="Select event"
                              />
                            </label>
                          </>
                        ) : null}
                        <button
                          type="button"
                          className="hv-timeline-expand-btn"
                          title={isExpanded ? "Collapse event" : "Expand event"}
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            toggleTimelineEventExpanded(event.event_id);
                          }}
                        >
                          {isExpanded ? <ChevronUp size={16} strokeWidth={2.2} /> : <ChevronDown size={16} strokeWidth={2.2} />}
                        </button>
                      </div>
                    </div>
                    {isExpanded ? (
                      <div className="hv-timeline-tile-body">
                        <TimelineEventFormComponent
                          event={event}
                          content={content}
                          EditableFieldComponent={EditableFieldComponent}
                          onChange={(field, value) => updateTimelineField(event.timelineIndex, field, value)}
                          onRemove={() => requestRemoveTimelineEvent(event.timelineIndex)}
                          autoFocus={event.event_id === newTimelineEventId}
                          onUploadAttachments={(files) => addTimelineAttachmentPaths(event.timelineIndex, files)}
                          onFieldApprove={(fieldKey) => approveTimelineField(event.event_id, fieldKey)}
                          getFieldStatus={(fieldKey) => getTimelineFieldStatus(event.event_id, fieldKey, event[fieldKey])}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
              <button
                type="button"
                className="hv-timeline-add-btn"
                onClick={addTimelineEvent}
                title="Add a new visit or missing event"
                aria-label="Add a new visit or missing event"
              >
                <Plus size={16} strokeWidth={2.4} />
                <span>Add event</span>
              </button>
            </div>
          </>
        )}
      </Accordion.Body>
    </Accordion.Item>
  );
}
