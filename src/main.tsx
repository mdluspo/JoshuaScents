
  import { createRoot } from "react-dom/client";
  import App from "./app/App";
  import "./styles/index.css";
  import { initializeMonitoring } from "./lib/sentry";

  initializeMonitoring();
  createRoot(document.getElementById("root")!).render(<App />);
