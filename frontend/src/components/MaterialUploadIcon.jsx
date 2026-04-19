/**
 * Material Icons "upload" (24dp) — inline SVG to match Material Design without extra font fetch.
 */
function MaterialUploadIcon({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      width="48"
      height="48"
      fill="currentColor"
    >
      <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5z" />
    </svg>
  );
}

export default MaterialUploadIcon;
