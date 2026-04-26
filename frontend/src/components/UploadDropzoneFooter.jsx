import { FileText } from "lucide-react";

function DocumentPillIcon() {
  return <FileText aria-hidden="true" size={14} strokeWidth={2.1} className="hv-sample-pill-icon" />;
}

function UploadDropzoneFooter({ content, onSampleSelect }) {
  const samples = Array.isArray(content.sampleFiles) ? content.sampleFiles : [];
  const stopPropagation = (event) => event.stopPropagation();

  return (
    <footer
      className="hv-dropzone-attached-footer"
      onClick={stopPropagation}
      onKeyDown={stopPropagation}
    >
      <p className="hv-dropzone-footer-support mb-0">{content.footerSupportLine}</p>
      <div className="hv-dropzone-footer-samples">
        <p className="hv-dropzone-footer-intro mb-0">{content.samplePillsIntro}</p>
        <ul className="hv-dropzone-pill-list list-unstyled d-flex flex-wrap gap-2 mb-0 justify-content-center">
          {samples.map((item, index) => (
            <li key={item.fileName || `sample-file-${index}`}>
              <button
                type="button"
                className="hv-sample-pill"
                aria-label={`Sample document ${item.fileName}`}
                onClick={() => onSampleSelect?.(item.fileName)}
              >
                <DocumentPillIcon />
                <span>{item.fileName}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}

export default UploadDropzoneFooter;
