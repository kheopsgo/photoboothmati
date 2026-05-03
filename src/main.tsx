import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Try to lock the screen orientation to landscape (works in fullscreen / PWA on Android).
const lockLandscape = () => {
  const orientation = (screen as any).orientation;
  if (orientation && typeof orientation.lock === "function") {
    orientation.lock("landscape").catch(() => {
      /* ignored — browsers without fullscreen / kiosk mode reject this */
    });
  }
};

document.addEventListener("click", lockLandscape, { once: true });
lockLandscape();

createRoot(document.getElementById("root")!).render(<App />);
