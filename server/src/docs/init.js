/** Initialize the packaged API reference with system fonts and no search worker; surface renderer failure to the page. */
Redoc.init(
  "/docs/openapi.yaml",
  {
    sanitize: true,
    disableSearch: true,
    hideDownloadButtons: true,
    theme: {
      typography: {
        fontFamily: "system-ui, sans-serif",
        headings: { fontFamily: "system-ui, sans-serif" },
        code: { fontFamily: "monospace" },
      },
    },
  },
  document.getElementById("redoc"),
  (error) => {
    document.documentElement.dataset.redocState = error ? "error" : "ready";
    if (error) throw new Error("The API reference could not be rendered.");
  },
);
