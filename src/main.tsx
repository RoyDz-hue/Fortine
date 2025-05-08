import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";

console.log("[main.tsx] Script started. Attempting to render FULL App structure (without AuthProvider initially).");

try {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    console.log("[main.tsx] Root element found. Calling createRoot().render() with BrowserRouter and App.");
    createRoot(rootElement).render(
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    );
    console.log("[main.tsx] createRoot().render() called successfully for full app structure.");
  } else {
    console.error("[main.tsx] CRITICAL: Root element #root not found in DOM.");
  }
} catch (error) {
  console.error("[main.tsx] CRITICAL: Error during React rendering of full app structure:", error);
  const errorDiv = document.createElement("div");
  errorDiv.style.color = "red";
  errorDiv.style.padding = "20px";
  errorDiv.style.border = "2px solid red";
  errorDiv.style.backgroundColor = "white";
  errorDiv.style.position = "fixed";
  errorDiv.style.top = "10px";
  errorDiv.style.left = "10px";
  errorDiv.style.zIndex = "9999";
  errorDiv.textContent = "Error in main.tsx (full app structure): " + (error instanceof Error ? error.message : String(error)) + (error instanceof Error && error.stack ? " STACK: " + error.stack : "");
  document.body.prepend(errorDiv);
}

