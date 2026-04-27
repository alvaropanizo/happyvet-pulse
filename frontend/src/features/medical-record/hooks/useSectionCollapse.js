import { useEffect, useLayoutEffect, useRef, useState } from "react";

export function useSectionCollapse({
  medicalRecord,
  patientSectionStatus,
  ownerSectionStatus,
  timelineSectionStatus,
  editCollapseIdleMs = 5000,
}) {
  const [activeSectionKeys, setActiveSectionKeys] = useState(["patient", "owner", "timeline", "overview"]);
  const [sparklingSections, setSparklingSections] = useState([]);
  const previousSectionStatusesRef = useRef({
    patient: null,
    owner: null,
    timeline: null,
  });
  const sectionEditCollapseTimersRef = useRef({});

  const clearSectionEditCollapseTimer = (sectionKey) => {
    const timerId = sectionEditCollapseTimersRef.current[sectionKey];
    if (timerId) {
      window.clearTimeout(timerId);
      delete sectionEditCollapseTimersRef.current[sectionKey];
    }
  };

  const scheduleSectionEditCollapse = (sectionKey) => {
    clearSectionEditCollapseTimer(sectionKey);
    sectionEditCollapseTimersRef.current[sectionKey] = window.setTimeout(() => {
      setActiveSectionKeys((previous) => previous.filter((key) => key !== sectionKey));
      delete sectionEditCollapseTimersRef.current[sectionKey];
    }, editCollapseIdleMs);
  };

  const clearAllSectionTimers = () => {
    Object.keys(sectionEditCollapseTimersRef.current).forEach((sectionKey) => {
      clearSectionEditCollapseTimer(sectionKey);
    });
  };

  useLayoutEffect(() => {
    clearAllSectionTimers();
    setActiveSectionKeys(["overview"]);
    setSparklingSections([]);
    previousSectionStatusesRef.current = { patient: null, owner: null, timeline: null };
  }, [medicalRecord]);

  useEffect(
    () => () => {
      clearAllSectionTimers();
    },
    [],
  );

  useEffect(() => {
    const transitions = [
      ["patient", patientSectionStatus],
      ["owner", ownerSectionStatus],
      ["timeline", timelineSectionStatus],
    ];

    transitions.forEach(([sectionKey, status]) => {
      const previous = previousSectionStatusesRef.current[sectionKey];
      if (previous === "needs_review" && status === "approved") {
        setActiveSectionKeys((prev) => prev.filter((key) => key !== sectionKey));
        setSparklingSections((prev) => (prev.includes(sectionKey) ? prev : [...prev, sectionKey]));
        window.setTimeout(() => {
          setSparklingSections((prev) => prev.filter((key) => key !== sectionKey));
        }, 950);
      }
      previousSectionStatusesRef.current[sectionKey] = status;
    });
  }, [patientSectionStatus, ownerSectionStatus, timelineSectionStatus]);

  const toggleAccordionSection = (sectionKey) => {
    if (!sectionKey) return;
    if (Array.isArray(sectionKey)) {
      setActiveSectionKeys(sectionKey);
      return;
    }
    setActiveSectionKeys((prev) =>
      prev.includes(sectionKey) ? prev.filter((key) => key !== sectionKey) : [...prev, sectionKey],
    );
  };

  return {
    activeSectionKeys,
    sparklingSections,
    scheduleSectionEditCollapse,
    toggleAccordionSection,
    setActiveSectionKeys,
    resetSectionState: () => {
      clearAllSectionTimers();
      setActiveSectionKeys(["overview"]);
      setSparklingSections([]);
      previousSectionStatusesRef.current = { patient: null, owner: null, timeline: null };
    },
  };
}
