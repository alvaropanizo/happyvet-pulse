function ReviewPane({ title, children }) {
  return (
    <div className="hv-document-review-pane">
      {title ? (
        <h2 className="h6 mb-3 hv-title hv-document-review-pane-title">
          {title}
        </h2>
      ) : null}
      <div className="hv-document-review-pane-body">{children}</div>
    </div>
  );
}

function DocumentReviewSplitLayout({ leftPaneTitle, leftPane, rightPane, layoutAriaLabel, scanCompleted }) {
  return (
    <section
      className={`hv-document-review-split${scanCompleted ? " hv-document-review-split--scanned" : ""}`}
      aria-label={layoutAriaLabel}
    >
      <ReviewPane title={leftPaneTitle}>{leftPane}</ReviewPane>
      <ReviewPane>{rightPane}</ReviewPane>
    </section>
  );
}

export default DocumentReviewSplitLayout;
