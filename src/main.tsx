import { createRoot } from "react-dom/client";
import App from "./App.tsx"; // Minimal "Hello World" App
import "./index.css";

console.log("[main.tsx] Script started. Attempting to render minimal App.");

try {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    console.log("[main.tsx] Root element found. Calling createRoot().render().");
    createRoot(rootElement).render(
        <App />
    );
    console.log("[main.tsx] createRoot().render() called successfully.");
  } else {
    console.error("[main.tsx] CRITICAL: Root element #root not found in DOM.");
    const newRoot = document.createElement('div');
    newRoot.id = 'root';
    document.body.appendChild(newRoot);
    console.log("[main.tsx] Created and appended #root. This indicates an issue with original index.html or its loading.");
  }
} catch (error) {
  console.error("[main.tsx] CRITICAL: Error during React rendering:", error);
  const errorDiv = document.createElement("div");
  errorDiv.style.color = "red";
  errorDiv.style.padding = "20px";
  errorDiv.style.border = "2px solid red";
  errorDiv.style.backgroundColor = "white";
  errorDiv.style.position = "fixed";
  errorDiv.style.top = "10px";
  errorDiv.style.left = "10px";
  errorDiv.style.zIndex = "9999";
  errorDiv.textContent = "Error in main.tsx: " + (error instanceof Error ? error.message : String(error)) + (error instanceof Error && error.stack ? " STACK: " + error.stack : "");
  document.body.prepend(errorDiv);
}

