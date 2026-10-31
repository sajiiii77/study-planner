import React from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./styles.css";
import "./styles/tokens.css";
import "./styles/shell.css";
import "./styles/dashboard.css";
import "./styles/pages.css";
import "./styles/insights.css";
import "./styles/polish.css";

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </ErrorBoundary>
);
