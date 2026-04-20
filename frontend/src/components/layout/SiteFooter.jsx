function SiteFooter({ content }) {
  return (
    <footer className="hv-site-footer">
      <p className="mb-0 hv-site-footer-inner">
        <span>{content.lead}</span>
        <a
          href={content.authorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hv-site-footer-link"
        >
          {content.authorName}
        </a>
      </p>
    </footer>
  );
}

export default SiteFooter;
