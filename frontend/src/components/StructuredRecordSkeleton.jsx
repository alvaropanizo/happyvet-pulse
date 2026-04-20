/** Grey “form window” placeholder until scan produces structured data (schema-agnostic). */

function StructuredRecordSkeleton({ ariaLabel }) {
  return (
    <section className="hv-structured-record-skeleton" aria-label={ariaLabel}>
      <div className="hv-structured-record-skeleton-chrome" aria-hidden="true" />
      <div className="hv-structured-record-skeleton-body">
        <div className="hv-structured-record-skeleton-line hv-structured-record-skeleton-line--lg" aria-hidden="true" />
        <div className="hv-structured-record-skeleton-line hv-structured-record-skeleton-line--md" aria-hidden="true" />
        <div className="hv-structured-record-skeleton-line hv-structured-record-skeleton-line--sm" aria-hidden="true" />
        <div className="hv-structured-record-skeleton-line hv-structured-record-skeleton-line--full" aria-hidden="true" />
        <div className="hv-structured-record-skeleton-line hv-structured-record-skeleton-line--full" aria-hidden="true" />
        <div className="hv-structured-record-skeleton-line hv-structured-record-skeleton-line--sm" aria-hidden="true" />
        <div className="hv-structured-record-skeleton-line hv-structured-record-skeleton-line--lg" aria-hidden="true" />
      </div>
    </section>
  );
}

export default StructuredRecordSkeleton;
