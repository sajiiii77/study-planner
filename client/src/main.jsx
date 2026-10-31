import React from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import App from "./App.jsx";
import "./styles.css";
import "./styles/tokens.css";
import "./styles/shell.css";
import "./styles/dashboard.css";

createRoot(document.getElementById("root")).render(
  <MotionConfig reducedMotion="user">
    <App />
  </MotionConfig>
);
