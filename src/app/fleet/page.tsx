import type { Metadata } from "next";
import Link from "next/link";
import { FleetExplorer } from "./explorer";
import { CARAVANS } from "@/data/catalogue";

export const metadata: Metadata = {
  title: "Fleet",
  description: "Three luxury caravans for hire from Bath: compact tourer, premium two-berth and family four-berth. Filter by berths, weights and facilities.",
};

export default function FleetPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  return (
    <div className="bg-paper">
      <div className="border-b border-border bg-sand/50">
        <div className="mx-auto max-w-wide px-5 py-12 sm:px-8">
          <p className="tick-label">Fleet catalogue</p>
          <h1 className="mt-3 font-display text-5xl leading-[1.02] text-charcoal">Choose your way to travel.</h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted">
            {CARAVANS.length} caravans, each with verified weights, honest nightly rates and live availability.
            Filters reflect real inventory attributes only. Search parameters are kept in the URL — share or return any time.
          </p>
        </div>
      </div>
      <FleetExplorer initial={searchParams} />
      <div className="mx-auto max-w-content px-5 pb-16 sm:px-8">
        <p className="border-t border-border pt-6 text-[0.85rem] text-muted">
          Towing weights are MTPLM (maximum technically permissible laden mass). Your tow-car match is checked at
          handover — see the <Link href="/towing-guide" className="font-semibold text-forest underline">towing guide</Link>.
        </p>
      </div>
    </div>
  );
}
