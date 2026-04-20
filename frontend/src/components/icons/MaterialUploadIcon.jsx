/**
 * Inline SVG icon (Material-style “upload”).
 *
 * Why inline SVG instead of icon fonts/CDN sprites:
 * - Colors follow `currentColor`; no extra font/CSS requests.
 * - Works with CSP and tree-shakes per import (when split by route).
 *
 * When you need dozens of icons, consider a curated set (`lucide-react`, `@radix-ui/react-icons`)
 * or an SVG sprite build step; keep one-off primitives here as small components.
 */
function MaterialUploadIcon({ className = "", size = 48 }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      width={size}
      height={size}
      fill="currentColor"
    >
      <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5z" />
    </svg>
  );
}

export default MaterialUploadIcon;
