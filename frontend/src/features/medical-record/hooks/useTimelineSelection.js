import { useEffect, useRef, useState } from "react";

export function useTimelineSelection(editCollapseIdleMs = 5000) {
  const [expandedEventIds, setExpandedEventIds] = useState([]);
  const [selectedTimelineEventIds, setSelectedTimelineEventIds] = useState([]);
  const [timelineBulkMenuOpen, setTimelineBulkMenuOpen] = useState(false);
  const timelineBulkMenuRef = useRef(null);
  const timelineEventCollapseTimersRef = useRef({});

  const clearTimelineEventCollapseTimer = (eventId) => {
    const timerId = timelineEventCollapseTimersRef.current[eventId];
    if (timerId) {
      window.clearTimeout(timerId);
      delete timelineEventCollapseTimersRef.current[eventId];
    }
  };

  const scheduleTimelineEventCollapse = (eventId) => {
    clearTimelineEventCollapseTimer(eventId);
    timelineEventCollapseTimersRef.current[eventId] = window.setTimeout(() => {
      setExpandedEventIds((previous) => previous.filter((id) => id !== eventId));
      delete timelineEventCollapseTimersRef.current[eventId];
    }, editCollapseIdleMs);
  };

  const clearAllTimelineCollapseTimers = () => {
    Object.keys(timelineEventCollapseTimersRef.current).forEach((eventId) => {
      clearTimelineEventCollapseTimer(eventId);
    });
  };

  useEffect(() => {
    if (!timelineBulkMenuOpen) return undefined;
    const onPointerDown = (event) => {
      if (!timelineBulkMenuRef.current) return;
      if (!timelineBulkMenuRef.current.contains(event.target)) {
        setTimelineBulkMenuOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [timelineBulkMenuOpen]);

  useEffect(
    () => () => {
      clearAllTimelineCollapseTimers();
    },
    [],
  );

  const toggleTimelineEventExpanded = (eventId) => {
    setExpandedEventIds((previous) =>
      previous.includes(eventId) ? previous.filter((id) => id !== eventId) : [...previous, eventId],
    );
  };

  const toggleTimelineEventSelected = (eventId) => {
    setSelectedTimelineEventIds((previous) =>
      previous.includes(eventId) ? previous.filter((id) => id !== eventId) : [...previous, eventId],
    );
  };

  const selectAllTimelineEvents = (timelineEvents) => {
    setSelectedTimelineEventIds((timelineEvents ?? []).map((event) => event.event_id).filter(Boolean));
    setTimelineBulkMenuOpen(false);
  };

  const clearTimelineEventSelection = () => {
    setSelectedTimelineEventIds([]);
    setTimelineBulkMenuOpen(false);
  };

  const resetTimelineSelection = () => {
    clearAllTimelineCollapseTimers();
    setExpandedEventIds([]);
    setSelectedTimelineEventIds([]);
    setTimelineBulkMenuOpen(false);
  };

  return {
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
    clearAllTimelineCollapseTimers,
    resetTimelineSelection,
  };
}
