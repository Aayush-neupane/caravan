import Link from "next/link";
import type { Metadata } from "next";
import { CinematicHero } from "@/components/editorial/Hero";

export const metadata: Metadata = {
  title: "That lane does not exist",
  robots: { index: false, follow: false },
};

// A wrong turn still gets the golden-hour drive — then a signpost home.
export default function NotFound() {
  return (
    <>
      <CinematicHero />
      <section className="border-t border-border bg-paper" aria-label="Page not found">
        <div className="mx-auto max-w-content px-5 py-16 text-center sm:px-8">
          <p className="tick-label">404 · Wrong turn</p>
          <h1 className="mx-auto mt-3 max-w-2xl font-display text-5xl leading-tight">That lane does not exist.</h1>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted">
            The page moved or was never signposted. The van, at least, is still on the road above.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/" className="btn-primary">Back home</Link>
            <Link href="/fleet" className="btn-secondary">Meet the fleet</Link>
          </div>
          <p className="mt-6 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
            Grid ref ST 726 651 · Lansdown Depot can point you right
          </p>
        </div>
      </section>
    </>
  );
}
