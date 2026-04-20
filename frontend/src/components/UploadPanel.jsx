import { useEffect, useRef, useState } from "react";
import { Card } from "react-bootstrap";

import MaterialUploadIcon from "./icons/MaterialUploadIcon";
import UploadDropzoneFooter from "./UploadDropzoneFooter";

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
          <MaterialUploadIcon className="hv-material-upload-icon" />
          <h2 className="h4 mt-3 mb-2 hv-title hv-dropzone-title">
            {content.primaryLabel}
          </h2>
          <p className="mb-0 hv-upload-secondary hv-dropzone-caption">
            {content.caption}
          </p>
        </Card.Body>
        <UploadDropzoneFooter content={content} />
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
