import Link from "next/link";
import { gbp } from "@/lib/format";
import { Compass, Framed, Stamp } from "./Decor";

// Split editorial hero: ink-on-paper typography beside a tall framed
// photograph. No scroll choreography, no full-bleed cliché.
export function CinematicHero() {
  return (
    <section className="relative overflow-hidden bg-paper" aria-label="Introduction">
      <div className="mx-auto max-w-wide px-5 pb-10 pt-24 sm:px-8 sm:pt-28">
        <div className="flex items-center justify-between gap-4 border-b-2 border-forest pb-3 font-mono text-[0.68rem] font-bold uppercase tracking-[0.2em] text-charcoal/70">
          <span>Field log Nº 01 — Bath, Somerset</span>
          <span className="hidden sm:inline">51.3811° N, 2.3590° W</span>
          <Compass size={22} className="text-forest" />
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h1 className="font-display leading-[0.94] text-charcoal" style={{ fontSize: "clamp(3.4rem, 7.5vw, 6.4rem)", letterSpacing: "-0.015em" }}>
              Leave room for the <em className="text-forest">unexpected</em><span className="text-amberDark">.</span>
            </h1>
            <p className="mt-6 max-w-xl text-[1.12rem] leading-relaxed text-charcoal/80">
              Thoughtfully equipped caravans for the freedom to travel at your own pace —
              across the Cotswolds, the South West and Wales.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="#permit" className="btn-primary !px-7 !py-3.5 !text-base">Check availability</Link>
              <Link href="/fleet" className="btn-secondary !px-7 !py-3.5 !text-base">Meet the fleet</Link>
            </div>
            <dl className="mt-9 grid max-w-lg grid-cols-3 gap-4 border-t border-border pt-5">
              <div><dt className="tick-accent">Caravans</dt><dd className="mt-1 font-display text-3xl text-forest">Three</dd></div>
              <div><dt className="tick-accent">Sleeps</dt><dd className="mt-1 font-display text-3xl text-forest">2 – 4</dd></div>
              <div><dt className="tick-accent">From</dt><dd className="mt-1 font-display text-3xl text-forest">{gbp(9500)}<span className="font-sans text-sm text-muted"> /nt</span></dd></div>
            </dl>
          </div>

          <div className="relative lg:col-span-5">
            <Framed
              src="https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&w=1200&q=70"
              alt="The Alder caravan on open moorland under a wide sky"
              caption="Open moorland — room to breathe"
              meta="FRAME 001 · 35MM"
              ratio="aspect-[3/4]"
              eager
              radius={6}
            />
            <div className="absolute -bottom-8 -left-8 hidden sm:block">
              <Stamp size={104} />
            </div>
            <p className="mt-3 text-right font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted">
              Grid ref ST 726 651 — Lansdown Depot
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
