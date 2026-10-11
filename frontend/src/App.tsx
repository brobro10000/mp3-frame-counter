/** Compose the upload page; the hook owns business state and services own API request/response handling. */
import { AnalysisIntro } from "./components/AnalysisIntro.tsx";
import { AnalysisResult } from "./components/AnalysisResult.tsx";
import { PageHeader } from "./components/PageHeader.tsx";
import { UploadForm } from "./components/UploadForm.tsx";
import { useMp3Analysis } from "./hooks/useMp3Analysis.ts";

export function App() {
  const analysis = useMp3Analysis();

  return (
    <div className="page">
      <PageHeader />
      <main>
        <AnalysisIntro />
        <section className="analysis-card" aria-labelledby="card-title">
          <UploadForm
            pending={analysis.pending}
            hasSelectedFile={analysis.hasSelectedFile}
            onSelectFile={analysis.selectFile}
            onAnalyze={analysis.analyze}
          />
          <AnalysisResult state={analysis.state} />
        </section>
      </main>
      <footer>
        <span>Small details. Exact counts.</span>
        <span>MP3 frame counter</span>
      </footer>
    </div>
  );
}
