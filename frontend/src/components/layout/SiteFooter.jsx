function SiteFooter({ content }) {
  const { lead, authorName, authorUrl } = content;

  return (
    <footer className="hv-site-footer">
      <p className="mb-0 hv-site-footer-inner">
        <span>{lead}</span>
        <a
          href={authorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hv-site-footer-link"
        >
          {authorName}
        </a>
      </p>
    </footer>
  );
}

export default SiteFooter;
