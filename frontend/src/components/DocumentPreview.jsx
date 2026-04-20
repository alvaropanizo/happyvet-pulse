import { useEffect, useMemo, useState } from "react";
import { Card } from "react-bootstrap";

import { PREVIEW_TYPES } from "../constants/previewTypes";
import { getFileExtension, getPreviewType } from "../utils/filePreview";

function ImagePreview({ fileUrl, fileName, imageAltPrefix }) {
  return (
    <img
      src={fileUrl}
      alt={`${imageAltPrefix} ${fileName}`}
      className="hv-media-box hv-media-image"
    />
  );
}

/**
 * Embedded PDF uses the browser’s native viewer (`<iframe>` + blob URL).
 * Sidebar / thumbnail strip is drawn by Chromium/WebKit/etc. — not styleable via CSS.
 * For a thumbnail-free or custom toolbar, integrate PDF.js (`pdfjs-dist` / `react-pdf`).
 */
function PdfPreview({ fileUrl, fileName, pdfTitlePrefix }) {
  return (
    <iframe
      title={`${pdfTitlePrefix} ${fileName}`}
      src={fileUrl}
      className="hv-media-box hv-media-pdf"
    />
  );
}

function TextPreview({ textError, textPreview, textLoading }) {
  return (
    <div className="hv-media-box hv-media-text">
      {textError ? (
        <p className="mb-0 hv-error-text">
          {textError}
        </p>
      ) : (
        <pre className="mb-0 hv-info-text hv-pre-wrap">
          {textPreview || textLoading}
        </pre>
      )}
    </div>
  );
}

function DocxFallback({ fileName, docxUnsupported, fileSelectedPrefix }) {
  return (
    <div className="hv-media-box hv-fallback-box">
      <p className="mb-2 hv-error-text">
        {docxUnsupported}
      </p>
      <p className="mb-0 hv-info-text">
        {fileSelectedPrefix} <strong>{fileName}</strong>
      </p>
    </div>
  );
}

function UnsupportedFallback({ extension, unsupportedTitle, unsupportedFormatPrefix }) {
  return (
    <div className="hv-unsupported-box">
      <p className="mb-2 hv-error-text">
        {unsupportedTitle}
      </p>
      <p className="mb-0 hv-info-text">
        {unsupportedFormatPrefix} <strong>{extension || "unknown"}</strong>
      </p>
    </div>
  );
}

function DocumentPreview({ file, content, embedded = false }) {
  const [textPreview, setTextPreview] = useState("");
  const [textError, setTextError] = useState("");

  const extension = getFileExtension(file.name);
  const previewType = getPreviewType(file);
  const isImage = previewType === PREVIEW_TYPES.IMAGE;
  const isPdf = previewType === PREVIEW_TYPES.PDF;
  const isTxt = previewType === PREVIEW_TYPES.TEXT;
  const isDocx = previewType === PREVIEW_TYPES.DOCX;

  const fileUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => URL.revokeObjectURL(fileUrl);
  }, [fileUrl]);

  useEffect(() => {
    setTextPreview("");
    setTextError("");

    if (!isTxt) return;

    const reader = new FileReader();
    reader.onload = () => setTextPreview(String(reader.result ?? ""));
    reader.onerror = () => setTextError(content.textReadError);
    reader.readAsText(file);
  }, [content.textReadError, file, isTxt]);

  const mediaBlock = (
    <>
      {isImage ? (
        <ImagePreview
          fileUrl={fileUrl}
          fileName={file.name}
          imageAltPrefix={content.imageAltPrefix}
        />
      ) : null}

      {isPdf ? <PdfPreview fileUrl={fileUrl} fileName={file.name} pdfTitlePrefix={content.pdfTitlePrefix} /> : null}

      {isTxt ? <TextPreview textError={textError} textPreview={textPreview} textLoading={content.textLoading} /> : null}

      {isDocx ? (
        <DocxFallback
          fileName={file.name}
          docxUnsupported={content.docxUnsupported}
          fileSelectedPrefix={content.fileSelectedPrefix}
        />
      ) : null}

      {previewType === PREVIEW_TYPES.UNSUPPORTED ? (
        <UnsupportedFallback
          extension={extension}
          unsupportedTitle={content.unsupportedTitle}
          unsupportedFormatPrefix={content.unsupportedFormatPrefix}
        />
      ) : null}
    </>
  );

  if (embedded) {
    return (
      <section className="hv-review-preview-embedded" aria-label={content.title}>
        <header className="hv-review-preview-embedded-header">
          <h2 className="h6 mb-0 hv-title">{content.title}</h2>
        </header>
        <div className="hv-review-preview-embedded-body">{mediaBlock}</div>
      </section>
    );
  }

  return (
    <Card className="hv-card hv-card-spaced">
      <Card.Body>
        <h2 className="h6 hv-title">
          {content.title}
        </h2>

        {mediaBlock}
      </Card.Body>
    </Card>
  );
}

export default DocumentPreview;
