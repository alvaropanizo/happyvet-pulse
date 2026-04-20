function DocumentPillIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="currentColor"
      className="hv-sample-pill-icon"
    >
      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
    </svg>
  );
}

function UploadDropzoneFooter({ content }) {
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
