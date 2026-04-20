function DocumentReviewSplitLayout({ leftPaneTitle, leftPane, rightPane, layoutAriaLabel }) {
  return (
    <section className="hv-document-review-split" aria-label={layoutAriaLabel}>
      <div className="hv-document-review-pane">
        {leftPaneTitle ? (
          <h2 className="h6 mb-3 hv-title hv-document-review-pane-title">
            {leftPaneTitle}
          </h2>
        ) : null}
        <div className="hv-document-review-pane-body">{leftPane}</div>
      </div>
      <div className="hv-document-review-pane">
        <div className="hv-document-review-pane-body">{rightPane}</div>
      </div>
    </section>
  );
}

export default DocumentReviewSplitLayout;
