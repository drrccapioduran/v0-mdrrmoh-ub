import { createRoot } from "react-dom/client"
import App from "./App"
import "./index.css"

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        // Service worker registered successfully
      })
      .catch((error) => {
        if (process.env.NODE_ENV === "development") {
          console.error("SW registration failed:", error)
        }
      })
  })
}

createRoot(document.getElementById("root")!).render(<App />)
