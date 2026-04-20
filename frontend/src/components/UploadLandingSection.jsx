import UploadPanel from "./UploadPanel";

function UploadLandingSection({
  uploadContent,
  onFileSelected,
  uploadHeaderLine1Prefix,
  uploadHeaderLine2,
  rotatingWords,
}) {
  return (
    <section className="hv-upload-screen">
      <header className="hv-upload-header">
        <div className="hv-upload-header-copy">
          <h1 className="h1 mb-0 hv-title hv-upload-header-title">
            <span>{uploadHeaderLine1Prefix}</span>{" "}
            <span className="hv-rotating-words" aria-label="Supported input types">
              {rotatingWords.map((word) => (
                <span key={word} className="hv-rotating-word">{word}</span>
              ))}
            </span>
          </h1>
          <p className="mb-0 hv-upload-header-subtitle">
            {uploadHeaderLine2}
          </p>
        </div>
      </header>
      <div className="hv-upload-main">
        <UploadPanel onFileSelected={onFileSelected} content={uploadContent} />
      </div>
    </section>
  );
}

export default UploadLandingSection;
