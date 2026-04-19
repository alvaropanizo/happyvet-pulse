const REQUIRED_PATHS = [
  "app.uploadHeaderLine1Prefix",
  "app.uploadHeaderLine2",
  "app.themeFabAriaLabel",
  "app.resetFlow.buttonAriaLabel",
  "app.resetFlow.confirmTitle",
  "app.resetFlow.confirmMessage",
  "app.resetFlow.confirmYes",
  "app.resetFlow.confirmNo",
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
  "app.medicalRecord.rawExtractedTextTitle",
  "app.medicalRecord.rawExtractedTextEmpty",
  "app.medicalRecord.statusLabel",
  "app.medicalRecord.clinicLabel",
  "app.medicalRecord.dueDateLabel",
  "uploadPanel.primaryLabel",
  "uploadPanel.caption",
  "uploadPanel.footerSupportLine",
  "uploadPanel.samplePillsIntro",
  "uploadPanel.dragOverlayHint",
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

const SAMPLE_FILES_PATH = "uploadPanel.sampleFiles";

function getValueFromPath(object, path) {
  return path.split(".").reduce((accumulator, key) => accumulator?.[key], object);
}

function validateSampleFiles(uiContent) {
  const sampleFiles = getValueFromPath(uiContent, SAMPLE_FILES_PATH);
  if (!Array.isArray(sampleFiles) || sampleFiles.length === 0) {
    throw new Error(`Invalid uiContent.json. ${SAMPLE_FILES_PATH} must be a non-empty array.`);
  }

  const invalidEntry = sampleFiles.find(
    (entry) =>
      !entry ||
      typeof entry !== "object" ||
      typeof entry.fileName !== "string" ||
      entry.fileName.trim() === "",
  );

  if (invalidEntry) {
    throw new Error(
      `Invalid uiContent.json. Each ${SAMPLE_FILES_PATH} entry must be an object with a non-empty fileName string.`,
    );
  }
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

  validateSampleFiles(uiContent);

  return uiContent;
}
