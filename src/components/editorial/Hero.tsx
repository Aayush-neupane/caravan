import Link from "next/link";
import { gbp } from "@/lib/format";
import { Compass } from "./Decor";

// Static cinematic hero — no scroll choreography. The photograph carries
// the atmosphere; the convoy strip below carries the motion.
export function CinematicHero() {
  return (
    <section className="grain relative flex min-h-[94vh] items-end overflow-hidden bg-forest text-paper" aria-label="Introduction">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=2200&q=75"
        alt="Caravan pitched beside still water at dawn"
        className="absolute inset-0 h-full w-full object-cover opacity-90"
        loading="eager"
      />
      <div className="absolute inset-0" style={{ background: "rgba(18,32,25,0.55)" }} />
      <div className="absolute inset-x-0 top-16 flex items-center justify-between p-5 font-mono text-[0.68rem] font-bold uppercase tracking-[0.2em] text-paper/80 sm:p-7 sm:pt-5">
        <span>Field log Nº 01 — Bath, Somerset</span>
        <span className="hidden sm:inline">51.3811° N, 2.3590° W</span>
        <Compass size={24} className="text-sand" />
      </div>
      <div className="relative z-[2] mx-auto w-full max-w-wide px-5 pb-14 pt-32 sm:px-8">
        <h1 className="max-w-5xl font-display leading-[0.95]" style={{ fontSize: "clamp(3.2rem, 8.5vw, 7rem)", letterSpacing: "-0.015em" }}>
          Leave room for the unexpected.
        </h1>
        <p className="mt-5 max-w-xl text-[1.1rem] leading-relaxed text-paper/85">
          Thoughtfully equipped caravans for the freedom to travel at your own pace —
          across the Cotswolds, the South West and Wales.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
          <div className="flex flex-wrap gap-3">
            <Link href="#permit" className="btn-primary !border-white/20">Check availability</Link>
            <Link href="/fleet" className="btn-secondary !bg-transparent !text-paper !border-white/40 hover:!border-white">Meet the fleet</Link>
          </div>
          <p className="font-display text-xl">From {gbp(9500)} <span className="font-sans text-sm text-paper/60">/ night · sleeps 2–4</span></p>
        </div>
      </div>
    </section>
  );
}
