import { useEffect, useMemo, useState } from "react";
import { Card } from "react-bootstrap";

import { PREVIEW_TYPES } from "../constants/previewTypes";
import { previewStyles, sharedStyles, uiTheme } from "../styles/uiTheme";
import { getFileExtension, getPreviewType } from "../utils/filePreview";

function ImagePreview({ fileUrl, fileName, imageAltPrefix }) {
  return (
    <img
      src={fileUrl}
      alt={`${imageAltPrefix} ${fileName}`}
      style={{
        width: "100%",
        maxHeight: uiTheme.preview.imageMaxHeight,
        objectFit: "contain",
        ...previewStyles.mediaBox,
      }}
    />
  );
}

function PdfPreview({ fileUrl, fileName, pdfTitlePrefix }) {
  return (
    <iframe
      title={`${pdfTitlePrefix} ${fileName}`}
      src={fileUrl}
      style={{
        width: "100%",
        height: uiTheme.preview.pdfHeight,
        ...previewStyles.mediaBox,
      }}
    />
  );
}

function TextPreview({ textError, textPreview, textLoading }) {
  return (
    <div
      style={{
        ...previewStyles.mediaBox,
        padding: uiTheme.preview.textPadding,
        maxHeight: uiTheme.preview.textMaxHeight,
        overflow: "auto",
      }}
    >
      {textError ? (
        <p className="mb-0" style={previewStyles.errorText}>
          {textError}
        </p>
      ) : (
        <pre className="mb-0" style={{ whiteSpace: "pre-wrap", ...previewStyles.infoText }}>
          {textPreview || textLoading}
        </pre>
      )}
    </div>
  );
}

function DocxFallback({ fileName, docxUnsupported, fileSelectedPrefix }) {
  return (
    <div
      style={{
        ...previewStyles.mediaBox,
        padding: uiTheme.preview.fallbackPadding,
      }}
    >
      <p className="mb-2" style={previewStyles.errorText}>
        {docxUnsupported}
      </p>
      <p className="mb-0" style={previewStyles.infoText}>
        {fileSelectedPrefix} <strong>{fileName}</strong>
      </p>
    </div>
  );
}

function UnsupportedFallback({ extension, unsupportedTitle, unsupportedFormatPrefix }) {
  return (
    <div
      style={{
        border: `1px solid ${uiTheme.colors.primary}`,
        borderRadius: uiTheme.radius.inner,
        padding: uiTheme.preview.fallbackPadding,
        backgroundColor: uiTheme.colors.white,
      }}
    >
      <p className="mb-2" style={previewStyles.errorText}>
        {unsupportedTitle}
      </p>
      <p className="mb-0" style={previewStyles.infoText}>
        {unsupportedFormatPrefix} <strong>{extension || "unknown"}</strong>
      </p>
    </div>
  );
}

function DocumentPreview({ file, content }) {
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

  return (
    <Card style={previewStyles.card}>
      <Card.Body>
        <h2 className="h6" style={sharedStyles.panelTitle}>
          {content.title}
        </h2>

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
      </Card.Body>
    </Card>
  );
}

export default DocumentPreview;
