import { useState } from "react";

import { normalizeMedicalRecord } from "../utils/modelUtils";

export function useMedicalRecordDraftController({
  medicalRecord,
  requiredTimelineFields,
  approvedFieldStatuses,
  scheduleTimelineEventCollapse,
  setExpandedEventIds,
  setSelectedTimelineEventIds,
}) {
  const [draft, setDraft] = useState(() => normalizeMedicalRecord(medicalRecord));
  const [newTimelineEventId, setNewTimelineEventId] = useState(null);
  const [pendingDeleteTimelineIndex, setPendingDeleteTimelineIndex] = useState(null);
  const [pendingDeleteSelectedTimelineIds, setPendingDeleteSelectedTimelineIds] = useState([]);
  const [timelineFieldStatuses, setTimelineFieldStatuses] = useState({});
  const stableApprovedEventStatuses = new Set(["approved", "edited", "automatically_approved"]);

  const getTimelineFieldStatus = (eventId, fieldKey, value, eventStatus = "needs_review") => {
    const statusKey = `${eventId}.${fieldKey}`;
    if (timelineFieldStatuses[statusKey]) return timelineFieldStatuses[statusKey];
    if (value === null || value === undefined || String(value).trim() === "") return "empty";
    return stableApprovedEventStatuses.has(eventStatus) ? "automatically_approved" : "pending";
  };

  const getTimelineEventStatus = (event) => {
    const requiredStatuses = requiredTimelineFields.map((fieldKey) =>
      getTimelineFieldStatus(event.event_id, fieldKey, event?.[fieldKey], event?.status ?? "needs_review"),
    );
    const requiredApproved = requiredStatuses.every((status) => approvedFieldStatuses.has(status));
    if (!requiredApproved) return "needs_review";
    if ((event?.status ?? "needs_review") === "edited" || requiredStatuses.includes("edited")) return "edited";
    return "approved";
  };

  const updateFieldValue = (section, field, value) => {
    setDraft((previous) => ({
      ...previous,
      [section]: {
        ...previous[section],
        [field]: {
          ...previous[section][field],
          value,
          edited: previous[section][field]?.value === value ? previous[section][field]?.edited ?? false : true,
          status:
            previous[section][field]?.value === value
              ? previous[section][field]?.status ?? "empty"
              : value && String(value).trim()
                ? "edited"
                : "empty",
        },
      },
    }));
  };

  const approveField = (section, field) => {
    setDraft((previous) => ({
      ...previous,
      [section]: {
        ...previous[section],
        [field]: {
          ...previous[section][field],
          status: "approved",
          edited: true,
        },
      },
    }));
  };

  const updateTimelineField = (index, field, value) => {
    const parseJsonIfPossible = (rawValue) => {
      if (typeof rawValue !== "string") return rawValue;
      try {
        return JSON.parse(rawValue);
      } catch {
        return rawValue;
      }
    };
    let shouldScheduleCollapse = false;
    let collapseEventId = null;
    setDraft((previous) => ({
      ...previous,
      timeline: previous.timeline.map((event, eventIndex) => {
        if (eventIndex !== index) return event;
        const updated = { ...event, [field]: parseJsonIfPossible(value) };
        const resolvedEventId = updated.event_id || event.event_id;
        const previousRequiredStatuses = requiredTimelineFields.map((requiredField) =>
          getTimelineFieldStatus(resolvedEventId, requiredField, event?.[requiredField], event?.status ?? "needs_review"),
        );
        const previousRequiredApproved = previousRequiredStatuses.every((status) => approvedFieldStatuses.has(status));
        const nextFieldStatus = value !== null && value !== undefined && String(value).trim() !== "" ? "edited" : "empty";
        const requiredStatuses = requiredTimelineFields.map((requiredField) => {
          if (requiredField === field) return nextFieldStatus;
          return getTimelineFieldStatus(resolvedEventId, requiredField, updated?.[requiredField], event?.status ?? "needs_review");
        });
        const requiredApproved = requiredStatuses.every((status) => approvedFieldStatuses.has(status));
        if (!previousRequiredApproved && requiredApproved && requiredTimelineFields.includes(field)) {
          shouldScheduleCollapse = true;
          collapseEventId = resolvedEventId;
        }
        const nextEventStatus = requiredApproved
          ? ((event?.status ?? "needs_review") === "edited" || requiredStatuses.includes("edited") ? "edited" : "approved")
          : "needs_review";
        return { ...updated, status: nextEventStatus };
      }),
    }));
    const eventId = draft.timeline[index]?.event_id;
    if (eventId) {
      const statusKey = `${eventId}.${field}`;
      const nextStatus = value !== null && value !== undefined && String(value).trim() !== "" ? "edited" : "empty";
      setTimelineFieldStatuses((previous) => ({ ...previous, [statusKey]: nextStatus }));
      if (shouldScheduleCollapse && collapseEventId) scheduleTimelineEventCollapse(collapseEventId);
    }
  };

  const addTimelineAttachmentPaths = (index, files) => {
    const newAttachmentPaths = files.map((file) => `uploads/${file.name}`);
    setDraft((previous) => ({
      ...previous,
      timeline: previous.timeline.map((event, eventIndex) => {
        if (eventIndex !== index) return event;
        const merged = [...(event.attachments ?? []), ...newAttachmentPaths];
        const deduped = Array.from(new Set(merged));
        return { ...event, attachments: deduped };
      }),
    }));
  };

  const addTimelineEvent = () => {
    const eventId = `event_${draft.timeline.length + 1}`;
    setDraft((previous) => ({
      ...previous,
      timeline: [
        ...previous.timeline,
        {
          event_id: eventId,
          status: "needs_review",
          date: "",
          event_type: "visit",
          clinic: "",
          title: eventId,
          anamnesis: "",
          assessment: [],
          diagnoses: [],
          treatments: [],
          tests: [],
          attachments: [],
          source: null,
        },
      ],
    }));
    setNewTimelineEventId(eventId);
    setExpandedEventIds((previous) => (previous.includes(eventId) ? previous : [...previous, eventId]));
  };

  const removeTimelineEvent = (indexToRemove) => {
    const removedEvent = draft.timeline[indexToRemove];
    setDraft((previous) => ({
      ...previous,
      timeline: previous.timeline.filter((_, index) => index !== indexToRemove),
    }));
    if (removedEvent?.event_id) {
      setExpandedEventIds((previous) => previous.filter((eventId) => eventId !== removedEvent.event_id));
      setSelectedTimelineEventIds((previous) => previous.filter((eventId) => eventId !== removedEvent.event_id));
      setTimelineFieldStatuses((previous) =>
        Object.fromEntries(Object.entries(previous).filter(([key]) => !key.startsWith(`${removedEvent.event_id}.`))),
      );
    }
    setNewTimelineEventId(null);
  };

  const requestRemoveTimelineEvent = (indexToRemove) => {
    setPendingDeleteTimelineIndex(indexToRemove);
  };

  const confirmRemoveTimelineEvent = () => {
    if (pendingDeleteSelectedTimelineIds.length > 0) {
      const idSet = new Set(pendingDeleteSelectedTimelineIds);
      setDraft((previous) => ({
        ...previous,
        timeline: previous.timeline.filter((event) => !idSet.has(event.event_id)),
      }));
      setExpandedEventIds((previous) => previous.filter((eventId) => !idSet.has(eventId)));
      setSelectedTimelineEventIds((previous) => previous.filter((eventId) => !idSet.has(eventId)));
      setTimelineFieldStatuses((previous) =>
        Object.fromEntries(
          Object.entries(previous).filter(([statusKey]) => {
            return !pendingDeleteSelectedTimelineIds.some((eventId) => statusKey.startsWith(`${eventId}.`));
          }),
        ),
      );
      setPendingDeleteSelectedTimelineIds([]);
      setNewTimelineEventId(null);
      return;
    }
    if (pendingDeleteTimelineIndex === null) return;
    removeTimelineEvent(pendingDeleteTimelineIndex);
    setPendingDeleteTimelineIndex(null);
  };

  const requestRemoveSelectedTimelineEvents = (selectedTimelineEventIds) => {
    if (!selectedTimelineEventIds.length) return;
    setPendingDeleteSelectedTimelineIds([...selectedTimelineEventIds]);
  };

  const approveTimelineField = (eventId, fieldKey) => {
    const statusKey = `${eventId}.${fieldKey}`;
    setTimelineFieldStatuses((previous) => {
      if (previous[statusKey] === "edited") return previous;
      return { ...previous, [statusKey]: "approved" };
    });
    setDraft((previous) => ({
      ...previous,
      timeline: previous.timeline.map((event) => {
        if (event.event_id !== eventId) return event;
        const requiredStatuses = requiredTimelineFields.map((requiredField) => {
          if (requiredField === fieldKey) return "approved";
          return getTimelineFieldStatus(eventId, requiredField, event?.[requiredField], event?.status ?? "needs_review");
        });
        const requiredApproved = requiredStatuses.every((status) => approvedFieldStatuses.has(status));
        const nextEventStatus = requiredApproved ? (requiredStatuses.includes("edited") ? "edited" : "approved") : "needs_review";
        return { ...event, status: nextEventStatus };
      }),
    }));
  };

  const resetDraftState = () => {
    setDraft(normalizeMedicalRecord(medicalRecord));
    setNewTimelineEventId(null);
    setPendingDeleteTimelineIndex(null);
    setPendingDeleteSelectedTimelineIds([]);
    setTimelineFieldStatuses({});
  };

  return {
    draft,
    setDraft,
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
    removeTimelineEvent,
    requestRemoveTimelineEvent,
    requestRemoveSelectedTimelineEvents,
    confirmRemoveTimelineEvent,
    approveTimelineField,
    resetDraftState,
  };
}
