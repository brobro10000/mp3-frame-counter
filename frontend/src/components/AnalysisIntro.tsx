/** Explain the supported MP3 format and processing contract without starting requests or owning upload state. */
export function AnalysisIntro() {
  return (
    <section className="intro" aria-labelledby="page-title">
      <p className="eyebrow">
        <span aria-hidden="true" /> MP3 ANALYSIS
      </p>
      <h1 id="page-title">
        Every frame,
        <br />
        <em>accounted for.</em>
      </h1>
      <p className="intro-copy">Choose an MP3 and find its exact physical frame count. One file, one clear result.</p>
      <div className="format-note">
        <span className="note-line" aria-hidden="true" />
        <p>
          For MPEG-1 Layer III audio.
          <br />
          Your upload is processed without being saved.
        </p>
      </div>
    </section>
  );
}
