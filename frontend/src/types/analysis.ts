/** Mutually exclusive upload states keep validated results separate from pending work and retryable errors. */
export type AnalysisState =
  | { readonly kind: "idle"; readonly message: string }
  | { readonly kind: "pending" }
  | { readonly kind: "success"; readonly frameCount: number }
  | { readonly kind: "error"; readonly message: string };

/** The request service returns a terminal outcome; selection and request lifecycle belong to the hook. */
export type AnalysisOutcome = Extract<AnalysisState, { readonly kind: "success" | "error" }>;
