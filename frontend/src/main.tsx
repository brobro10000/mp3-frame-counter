/** Mount the upload screen; Vite bundles React and the existing CSS into same-origin static production assets. */
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "../styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("The upload screen root is missing.");
createRoot(root).render(<App />);
