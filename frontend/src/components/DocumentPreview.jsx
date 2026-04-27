import { useEffect, useState } from "react";
import { Card } from "react-bootstrap";

import FileQuickPreviewThumb from "./FileQuickPreviewThumb";
import { PREVIEW_TYPES } from "../constants/previewTypes";
import { getFileExtension, getPreviewType } from "../utils/filePreview";

const DEFAULT_IMAGE_THUMB_URL =
  "https://www.barkibu.com/images/templates/pre-sales/dog-and-cat.svg";

function ImagePreview({ fileUrl, fileName, imageAltPrefix, embedded = false }) {
  const frameClassName = embedded
    ? "hv-media-box hv-media-image-frame hv-media-image-frame--embedded"
    : "hv-media-box hv-media-image-frame";
  const imageClassName = embedded ? "hv-media-image hv-media-image--embedded" : "hv-media-image";

  return (
    <div className={frameClassName}>
      <img
        src={fileUrl}
        alt={`${imageAltPrefix} ${fileName}`}
        className={imageClassName}
        onError={(event) => {
          if (event.currentTarget.dataset.fallbackApplied === "true") return;
          event.currentTarget.dataset.fallbackApplied = "true";
          event.currentTarget.src = DEFAULT_IMAGE_THUMB_URL;
        }}
      />
    </div>
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
  const [fileUrl, setFileUrl] = useState("");

  const extension = getFileExtension(file.name);
  const previewType = getPreviewType(file);
  const isImage = previewType === PREVIEW_TYPES.IMAGE;
  const isPdf = previewType === PREVIEW_TYPES.PDF;
  const isTxt = previewType === PREVIEW_TYPES.TEXT;
  const isDocx = previewType === PREVIEW_TYPES.DOCX;

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setFileUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  useEffect(() => {
    setTextPreview("");
    setTextError("");

    if (!isTxt) return;

    const reader = new FileReader();
    reader.onload = () => setTextPreview(String(reader.result ?? ""));
    reader.onerror = () => setTextError(content.textReadError);
    reader.readAsText(file);
  }, [content.textReadError, file, isTxt]);

  const mediaBlockByType = {
    [PREVIEW_TYPES.IMAGE]: (
      fileUrl ? (
        <ImagePreview fileUrl={fileUrl} fileName={file.name} imageAltPrefix={content.imageAltPrefix} embedded={embedded} />
      ) : (
        <TextPreview textError="" textPreview="" textLoading={content.textLoading} />
      )
    ),
    [PREVIEW_TYPES.PDF]: (
      fileUrl ? (
        <PdfPreview fileUrl={fileUrl} fileName={file.name} pdfTitlePrefix={content.pdfTitlePrefix} />
      ) : (
        <TextPreview textError="" textPreview="" textLoading={content.textLoading} />
      )
    ),
    [PREVIEW_TYPES.TEXT]: (
      <TextPreview textError={textError} textPreview={textPreview} textLoading={content.textLoading} />
    ),
    [PREVIEW_TYPES.DOCX]: (
      <DocxFallback
        fileName={file.name}
        docxUnsupported={content.docxUnsupported}
        fileSelectedPrefix={content.fileSelectedPrefix}
      />
    ),
    [PREVIEW_TYPES.UNSUPPORTED]: (
      <UnsupportedFallback
        extension={extension}
        unsupportedTitle={content.unsupportedTitle}
        unsupportedFormatPrefix={content.unsupportedFormatPrefix}
      />
    ),
  };

  const mediaBlock = mediaBlockByType[previewType] ?? null;

  if (embedded) {
    const embeddedBody =
      previewType === PREVIEW_TYPES.PDF ? (
        <PdfPreview fileUrl={fileUrl} fileName={file.name} pdfTitlePrefix={content.pdfTitlePrefix} />
      ) : isImage ? (
        mediaBlock
      ) : (
      <div className="hv-review-preview-thumb-stage">
        <FileQuickPreviewThumb file={file} size="lg" />
        <p className="mb-0 hv-review-preview-thumb-name" title={file.name}>
          {file.name}
        </p>
      </div>
      );

    return (
      <section className="hv-review-preview-embedded" aria-label={content.title}>
        <header className="hv-review-preview-embedded-header">
          <h2 className="h6 mb-0 hv-title">{content.title}</h2>
        </header>
        <div className="hv-review-preview-embedded-body">{embeddedBody}</div>
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
