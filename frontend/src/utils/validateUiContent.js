const REQUIRED_PATHS = [
  "app.uploadTitle",
  "uploadPanel.dropInstruction",
  "uploadPanel.supportNote",
  "uploadPanel.selectButton",
  "uploadPanel.fileInputAriaLabel",
  "uploadPanel.selectedPrefix",
  "recentDocumentsPanel.title",
  "recentDocumentsPanel.emptyState",
  "documentPreview.title",
  "documentPreview.imageAltPrefix",
  "documentPreview.pdfTitlePrefix",
  "documentPreview.textReadError",
  "documentPreview.textLoading",
  "documentPreview.docxUnsupported",
  "documentPreview.fileSelectedPrefix",
  "documentPreview.unsupportedTitle",
  "documentPreview.unsupportedFormatPrefix",
];

function getValueFromPath(object, path) {
  return path.split(".").reduce((accumulator, key) => accumulator?.[key], object);
}

export function validateUiContent(uiContent) {
  const missingPaths = REQUIRED_PATHS.filter((path) => {
    const value = getValueFromPath(uiContent, path);
    return typeof value !== "string" || value.trim() === "";
  });

  if (missingPaths.length > 0) {
    throw new Error(
      `Invalid uiContent.json. Missing/empty required keys: ${missingPaths.join(", ")}`,
    );
  }

  return uiContent;
}
