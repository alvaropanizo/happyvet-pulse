import { Button, OverlayTrigger, Spinner, Tooltip } from "react-bootstrap";
import { ArrowRight, Check, Trash2 } from "lucide-react";

import { formatFileSize } from "../utils/formatFileSize";
import { getFileExtension } from "../utils/filePreview";

function splitFileName(fileName) {
  const trimmed = fileName.trim();
  if (!trimmed) return { base: "", extension: "" };
  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === trimmed.length - 1) {
    return { base: trimmed, extension: "" };
  }
  return {
    base: trimmed.slice(0, lastDot),
    extension: trimmed.slice(lastDot + 1),
  };
}

function DocumentReviewToolbar({
  file,
  scanButtonLabel,
  content,
  onScan,
  onRemoveClick,
  isScanning,
  scanComplete,
  shouldNudgeScan = false,
}) {
  const { base, extension } = splitFileName(file.name);
  const ext = extension || getFileExtension(file.name);
  const showExtChip = Boolean(ext);

  const scanTooltip = (
    <Tooltip id="hv-scan-action-tooltip" className="hv-review-toolbar-tooltip">
      {content.scanButtonTooltip}
    </Tooltip>
  );

  return (
    <div className="hv-review-toolbar">
      <div className="hv-review-toolbar-row-top">
        <div className="hv-review-toolbar-summary-inner">
          <span className="hv-review-toolbar-console-badge" aria-hidden="true">
            {content.badgeLetter}
          </span>
          <span className="hv-review-toolbar-summary-text">{content.addedFilesSummary}</span>
        </div>
        {scanComplete ? (
          <div className="hv-review-toolbar-scan-trigger">
            <div
              className="hv-review-toolbar-scan-complete"
              role="status"
              aria-label={content.scannedLabel}
            >
              <span className="hv-review-toolbar-scan-complete-label">{content.scannedLabel}</span>
              <Check className="hv-review-toolbar-scan-complete-check" size={18} strokeWidth={2.4} aria-hidden="true" />
            </div>
          </div>
        ) : isScanning ? (
          <div className="hv-review-toolbar-scan-trigger">
            <Button
              type="button"
              variant="secondary"
              className="hv-review-toolbar-scan-btn hv-review-toolbar-scan-btn--scanning"
              disabled
              aria-busy="true"
              aria-label={content.scanningButtonLabel}
            >
              <span className="hv-review-toolbar-scan-btn-label">{content.scanningButtonLabel}</span>
              <span className="hv-review-toolbar-scan-btn-spinner-wrap" aria-hidden="true">
                <Spinner
                  animation="border"
                  role="presentation"
                  size="sm"
                  className="hv-review-toolbar-scan-btn-spinner"
                />
              </span>
            </Button>
          </div>
        ) : (
          <OverlayTrigger placement="bottom" delay={{ show: 200, hide: 100 }} overlay={scanTooltip}>
            <span className="hv-review-toolbar-scan-trigger">
              <Button
                type="button"
                variant="secondary"
                className={`hv-review-toolbar-scan-btn${shouldNudgeScan ? " hv-review-toolbar-scan-btn--nudge" : ""}`}
                onClick={onScan}
              >
                <span className="hv-review-toolbar-scan-btn-label">{scanButtonLabel}</span>
                <ArrowRight className="hv-review-toolbar-scan-btn-icon" size={18} strokeWidth={2.2} aria-hidden="true" />
              </Button>
            </span>
          </OverlayTrigger>
        )}
      </div>

      <div className="hv-review-toolbar-row hv-review-toolbar-row-meta">
        <div className="hv-review-toolbar-file-line">
          <span className="hv-review-toolbar-file-base">
            {showExtChip ? base : file.name}
          </span>
          {showExtChip ? (
            <span className="hv-review-toolbar-file-format">.{ext.toUpperCase()}</span>
          ) : null}
          <span className="hv-review-toolbar-meta-sep" aria-hidden="true">
            ·
          </span>
          <span className="hv-review-toolbar-file-size">{formatFileSize(file.size)}</span>
        </div>
        <button
          type="button"
          className="hv-review-toolbar-remove"
          onClick={onRemoveClick}
          aria-label={content.removeFileAriaLabel}
        >
          <span className="hv-review-toolbar-remove-x" aria-hidden="true">
            <Trash2 size={16} strokeWidth={2.2} />
          </span>
        </button>
      </div>
    </div>
  );
}

export default DocumentReviewToolbar;
