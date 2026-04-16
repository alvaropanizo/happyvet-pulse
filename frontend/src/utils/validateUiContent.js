const REQUIRED_PATHS = [
  "app.uploadTitle",
  "app.uploadResult.title",
  "app.uploadResult.fileNameLabel",
  "app.uploadResult.contentTypeLabel",
  "app.uploadResult.fileSizeLabel",
  "app.uploadResult.textPreviewLabel",
  "app.medicalRecord.title",
  "app.medicalRecord.recordIdLabel",
  "app.medicalRecord.reviewStatusLabel",
  "app.medicalRecord.patientSectionTitle",
  "app.medicalRecord.patientNameLabel",
  "app.medicalRecord.speciesLabel",
  "app.medicalRecord.breedLabel",
  "app.medicalRecord.sexLabel",
  "app.medicalRecord.chipLabel",
  "app.medicalRecord.ownerSectionTitle",
  "app.medicalRecord.ownerNameLabel",
  "app.medicalRecord.ownerAddressLabel",
  "app.medicalRecord.summarySectionTitle",
  "app.medicalRecord.timelineCountLabel",
  "app.medicalRecord.problemsCountLabel",
  "app.medicalRecord.remindersCountLabel",
  "app.medicalRecord.sourceDocsCountLabel",
  "app.medicalRecord.attachmentsCountLabel",
  "app.medicalRecord.recentTimelineTitle",
  "app.medicalRecord.problemListTitle",
  "app.medicalRecord.remindersTitle",
  "app.medicalRecord.statusLabel",
  "app.medicalRecord.clinicLabel",
  "app.medicalRecord.dueDateLabel",
  "uploadPanel.dropInstruction",
  "uploadPanel.supportNote",
  "uploadPanel.selectButton",
  "uploadPanel.scanButton",
  "uploadPanel.fileInputAriaLabel",
  "uploadPanel.selectedPrefix",
  "uploadPanel.uploadingMessage",
  "uploadPanel.uploadErrorPrefix",
  "uploadPanel.scanningMessage",
  "uploadPanel.scanErrorPrefix",
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
