/** Human-readable byte size for UI (binary units). */
export function formatFileSize(bytes) {
  if (typeof bytes !== "number" || bytes < 0) return "—";
  if (bytes === 0) return "0 B";

  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const value = bytes / k ** i;
  const decimals = i <= 1 ? (value < 10 && i > 0 ? 1 : 0) : 1;

  return `${parseFloat(value.toFixed(decimals))} ${units[i]}`;
}
