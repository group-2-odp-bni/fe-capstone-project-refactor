import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import "./index.css";
import { useEffect } from "react";
import { loadClarity } from "./util/clarity.js";
import {ToastProvider } from "./context/ToastContext.jsx"
const CLARITY_ID = import.meta.env.VITE_CLARITY_PROJECT_ID;

function Root() {
  const hasConsent = true;

  useEffect(() => {
    if (hasConsent) {
      loadClarity(CLARITY_ID);
    }
  }, [hasConsent]);

  return (
    <ToastProvider>
      <App />
    </ToastProvider>
  )

}
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
