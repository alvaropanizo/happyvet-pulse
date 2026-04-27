import { useEffect, useMemo, useRef, useState } from "react";
import { Accordion, Button, Card, Col, Form } from "react-bootstrap";
import {
  Check,
  ClipboardList,
  Hand,
  OctagonAlert,
  Pencil,
} from "lucide-react";
import ConfirmModal from "./common/ConfirmModal";
import { REQUIRED_FIELDS, REQUIRED_TIMELINE_FIELDS, isRequiredField } from "../contracts/uiRequiredFields";
import { OverviewSection, OwnerSection, PatientSection, TimelineSection } from "../features/medical-record/components/MedicalRecordSections";
import TimelineEventForm from "../features/medical-record/components/TimelineEventForm";
import { FIELD_STATUS, getStatusMeta } from "../features/medical-record/constants/statusModel";
import { eventTypeIcon } from "../features/medical-record/utils/timelineUtils";
import { useSectionCollapse } from "../features/medical-record/hooks/useSectionCollapse";
import { useMedicalRecordDraftController } from "../features/medical-record/hooks/useMedicalRecordDraftController";
import { useTimelineSelection } from "../features/medical-record/hooks/useTimelineSelection";
import { normalizeMedicalRecord, totalAttachments } from "../features/medical-record/utils/modelUtils";
import {
  getPatientApprovedIconBySpecies,
  isFieldApprovedStatus,
  getSectionStatusFromFields,
  getSectionStatusIcon,
} from "../features/medical-record/utils/statusAggregators";
import {
  buildClinicalHeader,
  buildRequiredBreakdown,
  buildTimelineRows,
  computeTimelineSectionStatus,
} from "../features/medical-record/selectors/medicalRecordSelectors";

const DEV_CONFIDENCE_ENABLED = (() => {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("dev") === "true";
})();

function displayValue(fieldValue) {
  const value = fieldValue?.value;
  return value === null || value === undefined || value === "" ? "" : String(value);
}


function FieldStatusIndicator({ status, onApprove }) {
  if (status === FIELD_STATUS.EMPTY) {
    return null;
  }
  if (status === FIELD_STATUS.AUTO_APPROVED) {
    return null;
  }
  if (status === FIELD_STATUS.APPROVED) {
    return (
      <span className="hv-field-status-right hv-field-status-right--approved" title="You have manually confirmed this information">
        <span className="hv-field-status-circle"><Check size={14} strokeWidth={2.4} /></span>
      </span>
    );
  }
  if (status === FIELD_STATUS.EDITED) {
    return (
      <span className="hv-field-status-right hv-field-status-right--edited" title="This field was manually edited">
        <span className="hv-field-status-circle"><Check size={14} strokeWidth={2.4} /></span>
      </span>
    );
  }
  return (
    <button
      type="button"
      className="hv-field-status-right hv-field-status-right--pending"
      onClick={onApprove}
      title="We have extracted some information from the document but you must review it cause it can contain not related information"
      aria-label="Approve extracted field value"
    >
      <span className="hv-field-status-circle"><Check size={14} strokeWidth={2.4} /></span>
    </button>
  );
}

function EditableFieldValue({
  label,
  fieldValue,
  type = "text",
  onChange,
  multiline = false,
  rows = 2,
  md = 6,
  fieldPath,
  isRequired = false,
  onApprove,
  resizable = false,
  options,
}) {
  const inputType = multiline ? undefined : type;
  const currentValue = displayValue(fieldValue);
  const isEmpty = currentValue.trim() === "";
  const showMissingRequired = isRequired && isEmpty;
  const showStatus = !showMissingRequired && !["empty"].includes(fieldValue?.status ?? "empty");
  const statusMeta = getStatusMeta(fieldValue?.status ?? "pending");
  const requiredFieldLabel = fieldPath?.split(".").pop() ?? fieldPath;
  const numericConfidence = Number(fieldValue?.confidence);
  const hasConfidence = Number.isFinite(numericConfidence);
  const normalizedConfidence = hasConfidence ? Math.max(0, Math.min(1, numericConfidence)) : null;
  return (
    <Form.Group as={Col} md={md}>
      <Form.Label className="mb-1 hv-form-field-label">
        {label}
        {isRequired ? " *" : ""}
      </Form.Label>
      <div className="hv-field-input-wrap">
        {Array.isArray(options) ? (
          <Form.Select
            value={currentValue}
            isInvalid={showMissingRequired}
            className="hv-field-input-with-action"
            onChange={(event) => onChange(event.target.value)}
          >
            <option value="">Select...</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
        ) : (
          <Form.Control
            as={multiline ? "textarea" : undefined}
            rows={multiline ? rows : undefined}
            type={inputType}
            value={currentValue}
            isInvalid={showMissingRequired}
            className={`hv-field-input-with-action ${
              multiline ? (resizable ? "hv-textarea-resizable" : "hv-textarea-fixed") : ""
            }`}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
        <FieldStatusIndicator status={fieldValue?.status} onApprove={onApprove} />
      </div>
      <div className="hv-field-meta-row">
        <small className={`hv-field-required-note${showMissingRequired ? " is-visible" : ""}`}>
          {showMissingRequired ? `Required field: ${requiredFieldLabel}` : ""}
        </small>
        {showStatus ? (
          <button
            type="button"
            className={statusMeta.className}
            title={statusMeta.title}
            onClick={fieldValue?.status === "pending" ? onApprove : undefined}
            disabled={fieldValue?.status !== "pending"}
          >
            <span className="hv-field-status-text-icon"><statusMeta.Icon size={14} strokeWidth={2.2} /></span>
            <span>{statusMeta.text}</span>
          </button>
        ) : null}
        {DEV_CONFIDENCE_ENABLED && hasConfidence ? (
          <small className="hv-dev-confidence-chip" title="Mapper confidence (debug)">
            conf: {normalizedConfidence.toFixed(2)}
          </small>
        ) : null}
      </div>
    </Form.Group>
  );
}

function SectionHeader({ title, Icon, sectionStatus, showWarning = true, sparkling = false }) {
  const hasWarning = sectionStatus === "needs_review";
  return (
    <span className={`hv-section-header hv-section-header--${sectionStatus}`}>
      <span className="hv-section-header-left">
        <span className={`hv-section-header-icon-wrap${sparkling ? " hv-section-header-icon-wrap--spark" : ""}`}>
          <Icon size={18} strokeWidth={2.1} />
        </span>
        <span className="hv-section-header-title">{title}</span>
      </span>
      {showWarning && hasWarning ? (
        <span className="hv-section-header-warning" title="This section contains extracted fields that may require review">
          <OctagonAlert size={16} strokeWidth={2.2} />
        </span>
      ) : null}
    </span>
  );
}

function EmptySectionValue({ message = "-" }) {
  return <p className="mb-0 hv-info-text">{message}</p>;
}

function MedicalRecordPanel({ medicalRecord, content }) {
  const overviewSectionRef = useRef(null);
  const APPROVED_FIELD_STATUSES = new Set(["approved", "edited", "automatically_approved"]);
  const EDIT_COLLAPSE_IDLE_MS = 5000;
  const {
    expandedEventIds,
    setExpandedEventIds,
    selectedTimelineEventIds,
    setSelectedTimelineEventIds,
    timelineBulkMenuOpen,
    setTimelineBulkMenuOpen,
    timelineBulkMenuRef,
    toggleTimelineEventExpanded,
    toggleTimelineEventSelected,
    selectAllTimelineEvents,
    clearTimelineEventSelection,
    scheduleTimelineEventCollapse,
    resetTimelineSelection,
  } = useTimelineSelection(EDIT_COLLAPSE_IDLE_MS);
  const {
    draft,
    newTimelineEventId,
    pendingDeleteTimelineIndex,
    setPendingDeleteTimelineIndex,
    pendingDeleteSelectedTimelineIds,
    setPendingDeleteSelectedTimelineIds,
    getTimelineFieldStatus,
    getTimelineEventStatus,
    updateFieldValue,
    approveField,
    updateTimelineField,
    addTimelineAttachmentPaths,
    addTimelineEvent,
    requestRemoveTimelineEvent,
    requestRemoveSelectedTimelineEvents,
    confirmRemoveTimelineEvent,
    approveTimelineField,
    resetDraftState,
  } = useMedicalRecordDraftController({
    medicalRecord,
    requiredTimelineFields: REQUIRED_TIMELINE_FIELDS,
    approvedFieldStatuses: APPROVED_FIELD_STATUSES,
    scheduleTimelineEventCollapse,
    setExpandedEventIds,
    setSelectedTimelineEventIds,
  });

  const patientSectionStatus = getSectionStatusFromFields([
    draft.patient.name,
    draft.patient.species,
    draft.patient.breed,
    draft.patient.sex,
    draft.patient.birth_date,
    draft.patient.chip_id,
    draft.patient.weight_kg,
  ]);
  const ownerSectionStatus = getSectionStatusFromFields([
    draft.owner.name,
    draft.owner.surname,
    draft.owner.phone_number,
    draft.owner.email,
  ]);
  const timelineSectionStatus = computeTimelineSectionStatus(draft.timeline, getTimelineEventStatus);
  const {
    activeSectionKeys,
    sparklingSections,
    scheduleSectionEditCollapse,
    toggleAccordionSection,
  } = useSectionCollapse({
    medicalRecord,
    patientSectionStatus,
    ownerSectionStatus,
    timelineSectionStatus,
    editCollapseIdleMs: EDIT_COLLAPSE_IDLE_MS,
  });

  const updateFieldValueWithSectionCollapse = (section, field, value) => {
    updateFieldValue(section, field, value);
    if (typeof value === "string" && value.length > 0) {
      scheduleSectionEditCollapse(section);
    }
  };

  useEffect(() => {
    resetDraftState();
    resetTimelineSelection();
  }, [medicalRecord]);

  useEffect(() => {
    const scrollableAncestor = (element) => {
      let current = element?.parentElement ?? null;
      while (current) {
        const computed = window.getComputedStyle(current);
        const overflowY = computed.overflowY;
        const canScroll = overflowY === "auto" || overflowY === "scroll";
        if (canScroll && current.scrollHeight > current.clientHeight) return current;
        current = current.parentElement;
      }
      return null;
    };

    const timeoutId = window.setTimeout(() => {
      const overviewElement = overviewSectionRef.current;
      if (!overviewElement) return;
      if (typeof overviewElement.scrollIntoView === "function") {
        overviewElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      const container = scrollableAncestor(overviewElement);
      if (container) {
        container.scrollBy({ top: 36, behavior: "smooth" });
      }
    }, 220);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [medicalRecord]);

  const patientSectionIcon = getSectionStatusIcon("patient", patientSectionStatus, draft.patient.species?.value);
  const ownerSectionIcon = getSectionStatusIcon("owner", ownerSectionStatus, draft.patient.species?.value);
  const timelineSectionIcon = getSectionStatusIcon("timeline", timelineSectionStatus, draft.patient.species?.value);
  const overviewSectionStatus =
    patientSectionStatus === "needs_review" || ownerSectionStatus === "needs_review" || timelineSectionStatus === "needs_review"
      ? "needs_review"
      : patientSectionStatus === "edited" || ownerSectionStatus === "edited" || timelineSectionStatus === "edited"
        ? "edited"
        : "approved";
  const isDocumentReviewedForHeader = [patientSectionStatus, ownerSectionStatus, timelineSectionStatus].every(
    (status) => status !== "needs_review",
  );
  const { clinicalHeaderStatus, clinicalHeaderTitle, clinicalHeaderPills } = buildClinicalHeader(draft, timelineSectionStatus);
  const hasConfirmedSpecies = isFieldApprovedStatus(draft.patient.species);
  const clinicalHeaderIcon = hasConfirmedSpecies
    ? getPatientApprovedIconBySpecies(draft.patient.species?.value)
    : getSectionStatusIcon("timeline", clinicalHeaderStatus, draft.patient.species?.value);
  const ClinicalHeaderIcon = clinicalHeaderIcon;
  const {
    patientRequiredStatuses,
    ownerRequiredStatuses,
    timelineRequiredStatuses,
    patientReviewedCount,
    ownerReviewedCount,
    historyReviewedCount,
    totalAutoApprovedCount,
    totalManualApprovedCount,
    totalNeedsReviewCount,
    totalRequiredCount,
  } = buildRequiredBreakdown(draft, getTimelineFieldStatus);

  useEffect(() => {
    setExpandedEventIds((previous) => {
      const next = previous.filter((eventId) => {
        const event = draft.timeline.find((entry) => entry.event_id === eventId);
        if (!event) return false;
        const status = getTimelineEventStatus(event);
        return status !== "approved";
      });
      if (next.length === previous.length) return previous;
      return next;
    });
  }, [draft.timeline]);

  const timelineRows = useMemo(() => buildTimelineRows(draft.timeline), [draft.timeline]);

  return (
    <Card className="hv-card hv-card-spaced">
      <Card.Body>
        <div className={`hv-clinical-header hv-clinical-header--${clinicalHeaderStatus}`}>
          <div className="hv-clinical-header-main">
            <span
              className={`hv-section-header-icon-wrap hv-clinical-header-icon-wrap${
                isDocumentReviewedForHeader ? " hv-clinical-header-icon-wrap--approved" : ""
              }`}
            >
              <ClinicalHeaderIcon size={28} strokeWidth={2.1} />
            </span>
            <div className="hv-clinical-header-content">
              <h3 className="hv-clinical-header-title">{clinicalHeaderTitle}</h3>
              {clinicalHeaderPills.length > 0 ? (
                <div className="hv-clinical-header-pills">
                  {clinicalHeaderPills.map((pill, index) => (
                    <span key={`${pill}-${index}`} className="hv-clinical-header-pill">{pill}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          {isDocumentReviewedForHeader ? (
            <span className="hv-clinical-header-ready-badge" title="All required fields are validated. Ready to save.">
              <Check size={16} strokeWidth={2.4} />
              <span>Ready to save</span>
            </span>
          ) : clinicalHeaderStatus === "needs_review" ? (
            <span className="hv-section-header-warning" title="This section contains extracted fields that may require review">
              <OctagonAlert size={16} strokeWidth={2.2} />
            </span>
          ) : null}
        </div>

        <Form className="mt-3 hv-medical-record-form">

          <Accordion activeKey={activeSectionKeys} onSelect={toggleAccordionSection} alwaysOpen>
            <PatientSection
              content={content}
              draft={draft}
              patientSectionStatus={patientSectionStatus}
              patientSectionIcon={patientSectionIcon}
              sparklingSections={sparklingSections}
              SectionHeaderComponent={SectionHeader}
              EditableFieldComponent={EditableFieldValue}
              approveField={approveField}
              updateFieldValue={updateFieldValueWithSectionCollapse}
            />

            <OwnerSection
              content={content}
              draft={draft}
              ownerSectionStatus={ownerSectionStatus}
              ownerSectionIcon={ownerSectionIcon}
              sparklingSections={sparklingSections}
              SectionHeaderComponent={SectionHeader}
              EditableFieldComponent={EditableFieldValue}
              approveField={approveField}
              updateFieldValue={updateFieldValueWithSectionCollapse}
            />

            <TimelineSection
              content={content}
              draft={draft}
              timelineSectionStatus={timelineSectionStatus}
              timelineSectionIcon={timelineSectionIcon}
              sparklingSections={sparklingSections}
              SectionHeaderComponent={SectionHeader}
              TimelineEventFormComponent={TimelineEventForm}
              EditableFieldComponent={EditableFieldValue}
              timelineRows={timelineRows}
              expandedEventIds={expandedEventIds}
              selectedTimelineEventIds={selectedTimelineEventIds}
              timelineBulkMenuOpen={timelineBulkMenuOpen}
              timelineBulkMenuRef={timelineBulkMenuRef}
              setTimelineBulkMenuOpen={setTimelineBulkMenuOpen}
              addTimelineEvent={addTimelineEvent}
              requestRemoveSelectedTimelineEvents={() => requestRemoveSelectedTimelineEvents(selectedTimelineEventIds)}
              selectAllTimelineEvents={() => selectAllTimelineEvents(draft.timeline)}
              clearTimelineEventSelection={clearTimelineEventSelection}
              eventTypeIcon={eventTypeIcon}
              getTimelineEventStatus={getTimelineEventStatus}
              toggleTimelineEventExpanded={toggleTimelineEventExpanded}
              requestRemoveTimelineEvent={requestRemoveTimelineEvent}
              toggleTimelineEventSelected={toggleTimelineEventSelected}
              updateTimelineField={updateTimelineField}
              newTimelineEventId={newTimelineEventId}
              addTimelineAttachmentPaths={addTimelineAttachmentPaths}
              approveTimelineField={approveTimelineField}
              getTimelineFieldStatus={getTimelineFieldStatus}
            />

            <OverviewSection
              content={content}
              draft={draft}
              SectionHeaderComponent={SectionHeader}
              overviewIcon={ClipboardList}
              overviewSectionStatus={overviewSectionStatus}
              patientReviewedCount={patientReviewedCount}
              patientRequiredTotal={patientRequiredStatuses.length}
              ownerReviewedCount={ownerReviewedCount}
              ownerRequiredTotal={ownerRequiredStatuses.length}
              historyReviewedCount={historyReviewedCount}
              historyRequiredTotal={timelineRequiredStatuses.length}
              totalAttachments={totalAttachments}
              totalAutoApprovedCount={totalAutoApprovedCount}
              totalManualApprovedCount={totalManualApprovedCount}
              totalNeedsReviewCount={totalNeedsReviewCount}
              totalRequiredCount={totalRequiredCount}
              overviewSectionRef={overviewSectionRef}
            />
          </Accordion>
        </Form>

        <ConfirmModal
          show={pendingDeleteTimelineIndex !== null || pendingDeleteSelectedTimelineIds.length > 0}
          onHide={() => {
            setPendingDeleteTimelineIndex(null);
            setPendingDeleteSelectedTimelineIds([]);
          }}
          title={pendingDeleteSelectedTimelineIds.length > 0 ? "Remove selected timeline events?" : "Remove timeline event?"}
          body={
            pendingDeleteSelectedTimelineIds.length > 0
              ? `You're going to remove ${pendingDeleteSelectedTimelineIds.length} events from the list. Are you sure?`
              : "This will permanently remove the selected clinical history event."
          }
          cancelLabel="Cancel"
          confirmLabel="Remove"
          onConfirm={confirmRemoveTimelineEvent}
        />
      </Card.Body>
    </Card>
  );
}

export default MedicalRecordPanel;
