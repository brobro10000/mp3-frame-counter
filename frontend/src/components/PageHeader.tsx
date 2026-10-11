/** Keep the page's static navigation and decorative wordmark independent of analysis state. */
export function PageHeader() {
  return (
    <header className="site-header">
      <a className="wordmark" href="/" aria-label="MP3 frame counter home">
        <span className="mark" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
        Frame counter
        <span className="wordmark-dot" aria-hidden="true">
          .
        </span>
      </a>
      <span className="header-note">A closer look at your audio</span>
    </header>
  );
}
