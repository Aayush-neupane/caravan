import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { SectionMarker } from "@/components/editorial/Decor";

export const metadata: Metadata = {
  title: "That lane does not exist",
  robots: { index: false, follow: false },
};

// A wrong turn gets a short, honest verdict — no pinned scenery, no heavy
// scroll choreography on a page nobody meant to visit.
export default function NotFound() {
  return (
    <div className="bg-paper">
      <div className="mx-auto max-w-content px-5 py-20 sm:px-8">
        <SectionMarker index="404" kicker="Wrong turn — this lane is not on the chart" coords="Grid ref Melways 29 E12" />
        <h1 className="mt-6 font-display text-5xl leading-[1.02] text-charcoal sm:text-6xl">That lane does not exist.</h1>
        <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-charcoal/85">
          The page you were looking for has moved, or never existed. The fleet and the routes are both a
          short drive from here.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn-primary">Back to home</Link>
          <Link href="/fleet" className="btn-secondary">Browse the fleet</Link>
        </div>
        <p className="mt-8 border-t border-border pt-5 text-[0.85rem] text-muted">
          Looking for a reservation?{" "}
          <Link href="/account" className="font-semibold text-forest underline underline-offset-4">Find it with your reference</Link>, or
          call the depot on <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="font-semibold text-forest underline underline-offset-4">{SITE.phone}</a>.
        </p>
      </div>
    </div>
  );
}
