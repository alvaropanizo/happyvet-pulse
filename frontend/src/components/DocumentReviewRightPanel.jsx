import Spinner from "react-bootstrap/Spinner";

import StructuredRecordSkeleton from "./StructuredRecordSkeleton";

function DocumentReviewRightPanel({
  isScanning,
  scanError,
  scanErrorPrefix,
  skeletonAriaLabel,
  scanningAriaLabel,
}) {
  const hasScanError = Boolean(scanError);

  return (
    <div className="hv-review-right-stack">
      {hasScanError ? (
        <section className="hv-review-right-error-banner" role="alert" aria-live="polite">
          <p className="mb-0 small hv-error-text">
            {scanErrorPrefix} {scanError}
          </p>
        </section>
      ) : null}

      <div className="hv-review-right-skeleton-wrap">
        <StructuredRecordSkeleton ariaLabel={skeletonAriaLabel} />
        {isScanning ? (
          <div
            className="hv-review-right-spinner-overlay"
            role="status"
            aria-label={scanningAriaLabel}
            aria-live="polite"
          >
            <Spinner
              animation="border"
              role="presentation"
              size="lg"
              className="hv-review-right-spinner"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default DocumentReviewRightPanel;
