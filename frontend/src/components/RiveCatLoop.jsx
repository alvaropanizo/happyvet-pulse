import { useEffect, useMemo, useState } from "react";
import { Alignment, Fit, Layout, useRive } from "@rive-app/react-canvas";

const SHOULD_ENABLE_RIVE =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  !/jsdom/i.test(globalThis.navigator?.userAgent ?? "");

const BLINK_ANIMATION = "blink";
const LEG_ANIMATION = "leg-movement";
const TAIL_ANIMATION = "tail-movement";

function playTimeline(rive, timelineName, layerName) {
  if (!rive || !timelineName) return;
  try {
    // User requested code-first timeline/layer triggering.
    if (layerName) {
      rive.play(timelineName, layerName);
      return;
    }
  } catch {
    // Fall through to the runtime-supported call signature.
  }
  rive.play(timelineName);
}

function pauseTimeline(rive, timelineName, layerName) {
  if (!rive || !timelineName) return;
  try {
    if (layerName) {
      rive.pause(timelineName, layerName);
      return;
    }
  } catch {
    // Fall through to the runtime-supported call signature.
  }
  rive.pause(timelineName);
}

function RiveCatCanvas({ src, artboard, isScanning, className, fallbackLabel }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const riveConfig = useMemo(
    () => ({
      src,
      ...(artboard ? { artboard } : {}),
      autoplay: false,
      layout: new Layout({
        fit: Fit.Contain,
        alignment: Alignment.Center,
      }),
      onLoad: () => setIsLoaded(true),
    }),
    [src, artboard],
  );

  const { RiveComponent, rive } = useRive(
    riveConfig,
    {
      shouldDisableRiveListeners: true,
    },
  );

  useEffect(() => {
    if (!rive) return;
    // Default idle behavior: blink only.
    playTimeline(rive, BLINK_ANIMATION);
    if (isScanning) {
      playTimeline(rive, LEG_ANIMATION);
      playTimeline(rive, TAIL_ANIMATION);
      return;
    }
    pauseTimeline(rive, LEG_ANIMATION);
    pauseTimeline(rive, TAIL_ANIMATION);
  }, [rive, isScanning]);

  return (
    <div className={`hv-rive-stage ${className}`.trim()} aria-label={fallbackLabel} role="img">
      {!isLoaded ? (
        <div className="hv-rive-fallback hv-rive-fallback--overlay" aria-hidden="true">
          <span className="hv-rive-fallback-emoji">🐱</span>
        </div>
      ) : null}
      <RiveComponent />
    </div>
  );
}

function RiveCatLoop({
  src,
  artboard,
  isScanning = false,
  fallbackLabel = "Cat animation",
  className = "",
}) {
  if (!SHOULD_ENABLE_RIVE || !src) {
    return (
      <div className={`hv-rive-fallback ${className}`.trim()} aria-label={fallbackLabel} role="img">
        <span className="hv-rive-fallback-emoji" aria-hidden="true">
          🐱
        </span>
      </div>
    );
  }

  return (
    <RiveCatCanvas
      src={src}
      artboard={artboard}
      isScanning={isScanning}
      className={className}
      fallbackLabel={fallbackLabel}
    />
  );
}

export default RiveCatLoop;
