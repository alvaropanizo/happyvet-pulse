/** Right-pointing arrow (Material-style arrow_forward), `currentColor` fill. */

function ArrowForwardIcon({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      width="1em"
      height="1em"
      fill="currentColor"
    >
      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
    </svg>
  );
}

export default ArrowForwardIcon;
