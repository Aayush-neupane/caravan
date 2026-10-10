import type { Metadata } from "next";
import { CinematicHero } from "@/components/editorial/Hero";
import { OfflineNotice } from "./notice";

export const metadata: Metadata = {
  title: "You are offline",
  robots: { index: false, follow: false },
};

// Offline fallback: the golden-hour drive above, then a layby notice.
// (Wire /offline as the service-worker fallback to serve it offline.)
export default function OfflinePage() {
  return (
    <>
      <CinematicHero />
      <section className="border-t border-border bg-sand/60" aria-label="Offline">
        <div className="mx-auto max-w-content px-5 py-16 text-center sm:px-8">
          <p className="tick-label">Layby · No signal</p>
          <h1 className="mx-auto mt-3 max-w-2xl font-display text-5xl leading-tight">The lanes will wait.</h1>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted">
            You are offline, so live availability cannot load. Anything already booked is safe —
            your reference will be waiting when the signal returns.
          </p>
          <OfflineNotice />
          <p className="mt-6 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
            Depot phone · +44 1225 555 014 · Mon–Sat 09:00–16:00
          </p>
        </div>
      </section>
    </>
  );
}
