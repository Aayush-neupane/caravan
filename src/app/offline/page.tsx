import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { SectionMarker } from "@/components/editorial/Decor";

export const metadata: Metadata = {
  title: "You are offline",
  robots: { index: false, follow: false },
};

// Served by the service worker as the offline fallback — deliberately
// light: no imagery, no scroll choreography, nothing to fetch.
export default function OfflinePage() {
  return (
    <div className="bg-paper">
      <div className="mx-auto max-w-content px-5 py-20 sm:px-8">
        <SectionMarker index="OFF" kicker="No connection — Brunswick Depot" coords="Offline fallback" />
        <h1 className="mt-6 font-display text-5xl leading-[1.02] text-charcoal sm:text-6xl">You are offline.</h1>
        <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-charcoal/85">
          This page is cached, so it still works without a connection. Availability and prices are only
          confirmed once you are back online — nothing is charged until you reach the depot counter.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn-primary">Back to home</Link>
          <Link href="/fleet" className="btn-secondary">Browse the fleet</Link>
        </div>
        <dl className="mt-10 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
          <div>
            <dt className="tick-label">Depot phone</dt>
            <dd className="mt-1 font-semibold text-forest">
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="underline underline-offset-4">{SITE.phone}</a>
            </dd>
          </div>
          <div>
            <dt className="tick-label">Already reserved?</dt>
            <dd className="mt-1 text-[0.95rem] leading-relaxed text-charcoal/85">
              Your collection voucher was emailed to you — keep it on your phone or on paper. The depot
              needs the reference, your driving licence and your tow-car documents at the counter.
            </dd>
          </div>
        </dl>
        <p className="mt-8 text-[0.85rem] text-muted">
          {SITE.address} · {SITE.email}
        </p>
      </div>
    </div>
  );
}
