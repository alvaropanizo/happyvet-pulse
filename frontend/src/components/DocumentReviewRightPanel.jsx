import ScanRightPanelLoading from "./ScanRightPanelLoading";
import StructuredRecordSkeleton from "./StructuredRecordSkeleton";

function DocumentReviewRightPanel({
  isScanning,
  skeletonAriaLabel,
  scanningAriaLabel,
}) {
  return (
    <div className="hv-review-right-stack">
      {isScanning ? (
        <ScanRightPanelLoading ariaLabel={scanningAriaLabel} />
      ) : (
        <StructuredRecordSkeleton ariaLabel={skeletonAriaLabel} />
      )}
    </div>
  );
}

export default DocumentReviewRightPanel;
