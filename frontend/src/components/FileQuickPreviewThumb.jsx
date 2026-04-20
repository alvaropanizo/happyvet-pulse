import { useEffect, useMemo, useState } from "react";

import { PREVIEW_TYPES } from "../constants/previewTypes";
import { getFileExtension, getPreviewType } from "../utils/filePreview";

const DEFAULT_IMAGE_THUMB_URL =
  "https://www.barkibu.com/images/templates/pre-sales/dog-and-cat.svg";

const ICON_BY_TYPE = {
  [PREVIEW_TYPES.PDF]: "PDF",
  [PREVIEW_TYPES.DOCX]: "DOCX",
  [PREVIEW_TYPES.UNSUPPORTED]: "FILE",
};

function normalizeSnippet(value) {
  return value.replace(/\s+/g, " ").trim().slice(0, 90);
}

function FileIconThumb({ extension, previewType, sizeClass }) {
  const label = ICON_BY_TYPE[previewType] || "FILE";
  return (
    <div className={`hv-file-thumb-icon hv-file-thumb-icon--${previewType || "file"}${sizeClass}`}>
      <span className="hv-file-thumb-icon-label">{label}</span>
      <span className="hv-file-thumb-ext">{(extension || "file").toUpperCase()}</span>
    </div>
  );
}

function FileQuickPreviewThumb({ file, size = "sm" }) {
  const [textSnippet, setTextSnippet] = useState("");
  const previewType = getPreviewType(file);
  const extension = getFileExtension(file.name);
  const isImage = previewType === PREVIEW_TYPES.IMAGE;
  const isText = previewType === PREVIEW_TYPES.TEXT;
  const sizeClass = size === "lg" ? " hv-file-thumb--lg" : "";

  const fileUrl = useMemo(() => {
    if (!isImage) return "";
    return URL.createObjectURL(file);
  }, [file, isImage]);

  useEffect(() => {
    if (!isImage || !fileUrl) return undefined;
    return () => URL.revokeObjectURL(fileUrl);
  }, [fileUrl, isImage]);

  useEffect(() => {
    setTextSnippet("");
    if (!isText) return;

    const reader = new FileReader();
    reader.onload = () => setTextSnippet(normalizeSnippet(String(reader.result ?? "")));
    reader.readAsText(file.slice(0, 4000));
  }, [file, isText]);

  if (isImage && fileUrl) {
    return (
      <img
        src={fileUrl}
        alt=""
        aria-hidden="true"
        className={`hv-file-thumb-image${sizeClass}`}
        onError={(event) => {
          if (event.currentTarget.dataset.fallbackApplied === "true") return;
          event.currentTarget.dataset.fallbackApplied = "true";
          event.currentTarget.src = DEFAULT_IMAGE_THUMB_URL;
        }}
      />
    );
  }

  if (isText) {
    return (
      <div className={`hv-file-thumb-text${sizeClass}`} aria-hidden="true">
        <span className="hv-file-thumb-text-tag">TXT</span>
        <span className="hv-file-thumb-text-snippet">{textSnippet || "Text document preview"}</span>
      </div>
    );
  }

  return <FileIconThumb extension={extension} previewType={previewType} sizeClass={sizeClass} />;
}

export default FileQuickPreviewThumb;
