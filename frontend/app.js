/**
 * Submit one selected File to the same-origin MP3 API and display an accessible, safely rendered result.
 * Loaded by index.html with defer; requires its labeled form, input, button and status elements. Selection alone
 * does not upload. Submission sends raw bytes as audio/mpeg, disables duplicate actions, and restores controls on
 * every outcome. Files above 20 MiB are rejected locally; the server remains authoritative for received bytes.
 * Requests have a 45-second browser deadline. API, malformed-response, timeout and network failures become text;
 * no uploads, results or filenames are retained in browser storage, logs or external services.
 */

const form = document.querySelector("#analysis-form");
const input = document.querySelector("#mp3-file");
const button = document.querySelector("#analyze-button");
const status = document.querySelector("#analysis-status");
const maximumBytes = 20 * 1024 * 1024;
let pending = false;

function message(text, state) {
  status.textContent = text;
  status.dataset.state = state;
}

input.addEventListener("change", () => {
  message(input.files.length ? "Ready when you are. Select Analyze MP3 to begin." : "Choose a file to begin.", "idle");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (pending) return;
  const file = input.files[0];
  if (!file) {
    message("Choose an MP3 file before starting an analysis.", "error");
    input.focus();
    return;
  }
  if (file.size > maximumBytes) {
    message("This file is too large. Choose an MP3 of 20 MiB (20,971,520 bytes) or less.", "error");
    return;
  }

  pending = true;
  input.disabled = true;
  button.disabled = true;
  form.setAttribute("aria-busy", "true");
  message("Analyzing your MP3…", "pending");
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch("/file-upload", {
      method: "POST",
      headers: { "Content-Type": "audio/mpeg" },
      body: file,
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      signal: controller.signal,
    });
    let payload;
    try {
      payload = await response.json();
    } catch {
      message("Unable to read the service response. Please try again.", "error");
      return;
    }
    if (!response.ok) {
      const detail = typeof payload?.error === "string" ? payload.error.trim() : "";
      message(detail ? `Error: ${detail}` : "Unable to analyze this file. Please try again.", "error");
      return;
    }
    // Accept only the promised success shape; never display a partial, fractional or malformed count.
    if (
      !payload ||
      Array.isArray(payload) ||
      Object.keys(payload).length !== 1 ||
      !Number.isSafeInteger(payload.frameCount) ||
      payload.frameCount <= 0
    ) {
      message("Unable to read a valid frame count. Please try again.", "error");
      return;
    }
    message(`${payload.frameCount} ${payload.frameCount === 1 ? "frame" : "frames"}`, "success");
  } catch {
    message(
      controller.signal.aborted
        ? "The analysis timed out. Please try again."
        : "Unable to reach the service. Check your connection and try again.",
      "error",
    );
  } finally {
    clearTimeout(deadline);
    pending = false;
    input.disabled = false;
    button.disabled = false;
    form.removeAttribute("aria-busy");
  }
});
