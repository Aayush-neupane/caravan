import Link from "next/link";
import { gbp } from "@/lib/format";
import { Compass } from "./Decor";
import { DriveScene } from "./DriveScene";

// Illustrated dusk drive-by: the world rolls past a steady convoy as you
// scroll — ridges slow, tower mid, telegraph poles fast, wheels spinning.
// Flat ink-on-paper artwork; fully static under reduced motion.
export function CinematicHero() {
  return (
    <section className="relative min-h-[108svh] overflow-hidden bg-forest text-paper" aria-label="Introduction">
      <div className="absolute inset-0" aria-hidden="true">
        <DriveScene />
      </div>

      <div className="absolute inset-x-0 top-16 flex items-center justify-between p-5 font-mono text-[0.68rem] font-bold uppercase tracking-[0.2em] text-paper/85 sm:p-7 sm:pt-5">
        <span>Field log Nº 01 — Bath, Somerset</span>
        <span className="hidden sm:inline">51.3811° N, 2.3590° W</span>
        <Compass size={24} className="text-sand" />
      </div>

      <div className="relative z-[2] mx-auto flex min-h-[108svh] w-full max-w-wide flex-col justify-center px-5 pb-56 pt-32 sm:px-8">
        <h1 className="max-w-5xl font-display leading-[0.95]" style={{ fontSize: "clamp(3.2rem, 8.5vw, 7rem)", letterSpacing: "-0.015em" }}>
          Leave room for the unexpected<span className="text-amber">.</span>
        </h1>
        <p className="mt-5 max-w-xl text-[1.1rem] leading-relaxed text-paper/85">
          Thoughtfully equipped caravans for the freedom to travel at your own pace —
          across the Cotswolds, the South West and Wales.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3">
          <div className="flex flex-wrap gap-3">
            <Link href="#permit" className="btn-primary !border-white/20">Check availability</Link>
            <Link href="/fleet" className="btn-secondary !bg-transparent !text-paper !border-white/40 hover:!border-white">Meet the fleet</Link>
          </div>
          <p className="font-display text-xl">From {gbp(9500)} <span className="font-sans text-sm text-paper/60">/ night · sleeps 2–4</span></p>
        </div>
        <p className="mt-8 font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-paper/60" aria-hidden="true">
          Scroll — the yard rolls past
          <span className="mt-2 block h-8 w-px bg-paper/50" />
        </p>
      </div>
    </section>
  );
}
