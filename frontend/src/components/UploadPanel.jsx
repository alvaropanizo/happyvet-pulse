import { useEffect, useRef, useState } from "react";
import { Card } from "react-bootstrap";
import { Upload } from "lucide-react";

import UploadDropzoneFooter from "./UploadDropzoneFooter";

const DEV_TOOLS_ENABLED = (() => {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("dev") === "true";
})();
const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024; // 1GB

function UploadPanel({
  onFileSelected,
  content,
}) {
  const fileInputRef = useRef(null);
  const dragDepthRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPageDragging, setIsPageDragging] = useState(false);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFile = (file) => {
    if (!file) return;
    onFileSelected(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    setIsPageDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const isFileDragEvent = (event) => {
    return Array.from(event.dataTransfer?.types ?? []).includes("Files");
  };

  useEffect(() => {
    const onWindowDragEnter = (event) => {
      if (!isFileDragEvent(event)) return;
      event.preventDefault();
      dragDepthRef.current += 1;
      setIsPageDragging(true);
    };

    const onWindowDragOver = (event) => {
      if (!isFileDragEvent(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    };

    const onWindowDragLeave = (event) => {
      if (!isFileDragEvent(event)) return;
      event.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setIsPageDragging(false);
        setIsDragging(false);
      }
    };

    const onWindowDrop = (event) => {
      if (!isFileDragEvent(event)) return;
      event.preventDefault();
      dragDepthRef.current = 0;
      setIsPageDragging(false);
      setIsDragging(false);
    };

    window.addEventListener("dragenter", onWindowDragEnter);
    window.addEventListener("dragover", onWindowDragOver);
    window.addEventListener("dragleave", onWindowDragLeave);
    window.addEventListener("drop", onWindowDrop);

    return () => {
      window.removeEventListener("dragenter", onWindowDragEnter);
      window.removeEventListener("dragover", onWindowDragOver);
      window.removeEventListener("dragleave", onWindowDragLeave);
      window.removeEventListener("drop", onWindowDrop);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("hv-drag-active", isPageDragging);
    return () => {
      document.body.classList.remove("hv-drag-active");
    };
  }, [isPageDragging]);

  const handleDropzoneBodyKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFilePicker();
    }
  };

  const inferMimeType = (fileName) => {
    const extension = String(fileName ?? "").toLowerCase().split(".").pop();
    if (extension === "pdf") return "application/pdf";
    if (extension === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (extension === "png") return "image/png";
    if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
    if (extension === "txt") return "text/plain";
    return "application/octet-stream";
  };

  const createSyntheticSampleFile = (fileName, sizeMb) => {
    const safeSizeMb = Math.max(1, Math.min(2048, Number(sizeMb) || 50));
    const targetBytes = Math.floor(safeSizeMb * 1024 * 1024);
    const mimeType = inferMimeType(fileName);
    const placeholderFile = new File(["synthetic large upload sample placeholder"], fileName, { type: mimeType });
    try {
      Object.defineProperty(placeholderFile, "size", {
        configurable: true,
        value: targetBytes,
      });
    } catch {
      // Fallback to real size if runtime blocks descriptor override.
    }
    return placeholderFile;
  };

  const visibleSampleFiles = (Array.isArray(content.sampleFiles) ? content.sampleFiles : []).filter((sample) => {
    if (sample?.syntheticLargeFile === true && !DEV_TOOLS_ENABLED) return false;
    return true;
  });

  const loadSampleFile = async (sampleEntry) => {
    const sample = typeof sampleEntry === "string" ? { fileName: sampleEntry } : sampleEntry;
    const fileName = sample?.fileName;
    if (!fileName) return;
    if (sample?.syntheticLargeFile === true) {
      const syntheticFile = createSyntheticSampleFile(fileName, sample.syntheticSizeMb);
      handleFile(syntheticFile);
      return;
    }
    const fixturePath = `/tests/e2e/fixtures/${encodeURIComponent(fileName)}`;
    try {
      const response = await fetch(fixturePath);
      if (!response.ok) {
        throw new Error(`Failed to load sample fixture: ${response.status}`);
      }
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type || inferMimeType(fileName) });
      handleFile(file);
    } catch (error) {
      // Fallback keeps pills usable even if fixture files are not publicly served in some environments.
      const fallbackFile = new File([""], fileName, { type: inferMimeType(fileName) });
      handleFile(fallbackFile);
      console.warn("[UploadPanel] Could not fetch sample file, using empty fallback file instead.", error);
    }
  };

  return (
    <section className="hv-upload-panel-shell">
      {isPageDragging ? (
        <div
          className="hv-page-drop-layer"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          aria-hidden="true"
        >
          <div className="hv-page-drop-hint">
            {content.dragOverlayHint}
          </div>
        </div>
      ) : null}
      <Card
        className={`hv-card hv-dropzone hv-upload-dropzone-card ${isDragging ? "is-dragging" : ""}`}
        onDrop={handleDrop}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
          setIsPageDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
      >
        <Card.Body
          className="text-center hv-dropzone-body"
          role="button"
          tabIndex={0}
          onClick={openFilePicker}
          onKeyDown={handleDropzoneBodyKeyDown}
          aria-label={`${content.primaryLabel}. ${content.caption}`}
        >
          <div className="hv-dropzone-primary-box">
            <Upload className="hv-material-upload-icon" size={48} strokeWidth={2.1} aria-hidden="true" />
            <h2 className="h4 mt-3 mb-2 hv-title hv-dropzone-title">
              {content.primaryLabel}
            </h2>
          </div>
          <p className="mb-0 hv-upload-secondary hv-dropzone-caption">
            {content.caption}
          </p>
        </Card.Body>
        <UploadDropzoneFooter content={{ ...content, sampleFiles: visibleSampleFiles }} onSampleSelect={loadSampleFile} />
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        className="hv-hidden-input"
        onChange={(event) => handleFile(event.target.files?.[0])}
        aria-label={content.fileInputAriaLabel}
      />
    </section>
  );
}

export default UploadPanel;
