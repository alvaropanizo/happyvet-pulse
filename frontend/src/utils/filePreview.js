import { PREVIEW_TYPES } from "../constants/previewTypes";

export function getFileExtension(fileName) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export function getPreviewType(file) {
  const extension = getFileExtension(file.name);
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf" || extension === "pdf";
  const isTxt = file.type.startsWith("text/") || extension === "txt";
  const isDocx =
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === "docx";

  if (isImage) return PREVIEW_TYPES.IMAGE;
  if (isPdf) return PREVIEW_TYPES.PDF;
  if (isTxt) return PREVIEW_TYPES.TEXT;
  if (isDocx) return PREVIEW_TYPES.DOCX;
  return PREVIEW_TYPES.UNSUPPORTED;
}
