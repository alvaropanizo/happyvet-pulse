import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMedicalRecordDraftController } from "./useMedicalRecordDraftController";

const REQUIRED_TIMELINE_FIELDS = ["event_type", "date", "clinic", "title"];
const APPROVED_FIELD_STATUSES = new Set(["approved", "edited", "automatically_approved"]);

function buildController(initialTimelineEvent) {
  return renderHook(() =>
    useMedicalRecordDraftController({
      medicalRecord: {
        record_id: "rec_1",
        patient: {},
        owner: {},
        source_documents: [],
        timeline: [initialTimelineEvent],
        review: { status: "needs_review" },
      },
      requiredTimelineFields: REQUIRED_TIMELINE_FIELDS,
      approvedFieldStatuses: APPROVED_FIELD_STATUSES,
      scheduleTimelineEventCollapse: vi.fn(),
      setExpandedEventIds: vi.fn(),
      setSelectedTimelineEventIds: vi.fn(),
    }),
  );
}

describe("useMedicalRecordDraftController timeline statuses", () => {
  it("keeps untouched required fields auto-approved after editing one required value", () => {
    const { result } = buildController({
      event_id: "event_1",
      status: "approved",
      event_type: "visit",
      date: "2026-04-20",
      clinic: "HappyVet",
      title: "General checkup",
    });

    act(() => {
      result.current.updateTimelineField(0, "title", "General checkup updated");
    });

    const event = result.current.draft.timeline[0];
    expect(result.current.getTimelineFieldStatus(event.event_id, "title", event.title, event.status)).toBe("edited");
    expect(result.current.getTimelineFieldStatus(event.event_id, "event_type", event.event_type, event.status)).toBe(
      "automatically_approved",
    );
    expect(result.current.getTimelineFieldStatus(event.event_id, "date", event.date, event.status)).toBe(
      "automatically_approved",
    );
    expect(result.current.getTimelineFieldStatus(event.event_id, "clinic", event.clinic, event.status)).toBe(
      "automatically_approved",
    );
    expect(result.current.getTimelineEventStatus(event)).toBe("edited");
  });

  it("marks event as approved when all required fields are approved/auto-approved", () => {
    const { result } = buildController({
      event_id: "event_2",
      status: "approved",
      event_type: "visit",
      date: "2026-04-20",
      clinic: "HappyVet",
      title: "General checkup",
    });

    const event = result.current.draft.timeline[0];
    expect(result.current.getTimelineFieldStatus(event.event_id, "event_type", event.event_type, event.status)).toBe(
      "automatically_approved",
    );
    expect(result.current.getTimelineFieldStatus(event.event_id, "date", event.date, event.status)).toBe(
      "automatically_approved",
    );
    expect(result.current.getTimelineFieldStatus(event.event_id, "clinic", event.clinic, event.status)).toBe(
      "automatically_approved",
    );
    expect(result.current.getTimelineFieldStatus(event.event_id, "title", event.title, event.status)).toBe(
      "automatically_approved",
    );
    expect(result.current.getTimelineEventStatus(event)).toBe("approved");
  });
});
