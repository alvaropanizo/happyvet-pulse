import Spinner from "react-bootstrap/Spinner";

/** Full-height loading state on the review right column while scan runs. */

function ScanRightPanelLoading({ ariaLabel }) {
  return (
    <section
      className="hv-review-scan-loading"
      aria-label={ariaLabel}
      role="status"
      aria-live="polite"
    >
      <div className="hv-review-scan-loading-inner">
        <Spinner
          animation="border"
          role="presentation"
          size="lg"
          className="hv-review-scan-loading-spinner"
        />
      </div>
    </section>
  );
}

export default ScanRightPanelLoading;
