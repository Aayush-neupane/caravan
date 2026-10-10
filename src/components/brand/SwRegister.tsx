"use client";

import { useEffect } from "react";

// Registers the offline-fallback service worker in production only.
// Dev builds use hashed chunk URLs that change on every recompile — caching
// them would serve stale shells referencing evicted chunks (unstyled page).
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Service worker registration failed:", err);
        }
      });
    // A new worker taking control means a new version is available — log it,
    // never force a reload underneath someone mid-booking.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.info("Wattle & Wander: new version available — it takes effect on the next load.");
    });
  }, []);
  return null;
}
