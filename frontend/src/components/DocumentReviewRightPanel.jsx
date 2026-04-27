import { useEffect, useMemo, useState } from "react";
import RiveCatLoop from "./RiveCatLoop";

const RIVE_CAT_SRC = "/animations/cat.riv";
function shuffleItems(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }
  return next;
}

function rotateWithRandomStart(items) {
  if (items.length <= 1) return items;
  const startIndex = Math.floor(Math.random() * items.length);
  return [...items.slice(startIndex), ...items.slice(0, startIndex)];
}

function DocumentReviewRightPanel({
  isScanning,
  scanError,
  scanErrorPrefix,
  skeletonAriaLabel,
  scanningAriaLabel: _scanningAriaLabel,
  content,
}) {
  const hasScanError = Boolean(scanError);
  const rotatingItems = useMemo(() => {
    return rotateWithRandomStart(shuffleItems(content.scanningRotationLines));
  }, [content.scanningRotationLines, isScanning]);
  const [activeRotationIndex, setActiveRotationIndex] = useState(0);

  useEffect(() => {
    if (!isScanning || rotatingItems.length === 0) return undefined;
    setActiveRotationIndex(Math.floor(Math.random() * rotatingItems.length));
    const intervalId = window.setInterval(() => {
      setActiveRotationIndex((previous) => (previous + 1) % rotatingItems.length);
    }, 3000);
    return () => window.clearInterval(intervalId);
  }, [isScanning, rotatingItems]);

  return (
    <div className="hv-review-right-stack">
      {hasScanError ? (
        <section className="hv-review-right-error-banner" role="alert" aria-live="polite">
          <p className="mb-0 small hv-error-text">
            {scanErrorPrefix} {scanError}
          </p>
        </section>
      ) : null}

      <section className="hv-review-right-idle-panel" role="region" aria-label={skeletonAriaLabel}>
        <div className="hv-review-right-rive-wrap">
          <RiveCatLoop
            src={RIVE_CAT_SRC}
            isScanning={isScanning}
            fallbackLabel={isScanning ? "Cat scanning animation" : "Cat waiting animation"}
            className="hv-review-right-rive"
          />
          {isScanning ? (
            <p className="hv-review-right-rotator">
              <span key={rotatingItems[activeRotationIndex]} className="hv-review-right-rotator-word">
                "{rotatingItems[activeRotationIndex]}"
              </span>
            </p>
          ) : (
            <p className="hv-review-right-ready-text">{content.readyToScanText}</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default DocumentReviewRightPanel;
