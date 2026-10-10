"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { gbp } from "@/lib/format";
import { Compass } from "./Decor";
import { DriveScene } from "./DriveScene";

function beat(progress: MotionValue<number>, a: number, b: number) {
  if (b >= 1) {
    // Final beat stays revealed — no fade-out at release.
    const opacity = useTransform(progress, [Math.max(0, a - 0.06), a], [0, 1]);
    const y = useTransform(progress, [a, Math.min(1, a + 0.07)], [30, 0]);
    return { opacity, y };
  }
  const opacity = useTransform(progress, [Math.max(0, a - 0.06), a, b, Math.min(1, b + 0.06)], [0, 1, 1, 0]);
  const y = useTransform(progress, [a, Math.min(1, a + 0.07), Math.max(0, b - 0.08), b], [30, 0, 0, -30]);
  return { opacity, y };
}

function Beat({ progress, a, b, children }: { progress: MotionValue<number>; a: number; b: number; children: React.ReactNode }) {
  const { opacity, y } = beat(progress, a, b);
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-x-0 top-[16%] sm:top-[18%]">
      {children}
    </motion.div>
  );
}

const KICKER = "font-mono text-[0.68rem] font-bold uppercase tracking-[0.22em] text-amber";

// Pinned departure: the page holds while the outfit tows west and three
// beats of text reveal in turn — headline, fleet + actions, departure.
export function CinematicHero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  if (reduce) {
    return (
      <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-forest text-paper" aria-label="Introduction">
        <div className="absolute inset-0" aria-hidden="true">
          <DriveScene />
        </div>
        <div className="relative z-[2] mx-auto w-full max-w-wide px-5 pb-16 pt-32 sm:px-8">
          <p className={KICKER}>Field log Nº 01 — Bath, Somerset</p>
          <h1 className="mt-3 max-w-5xl font-display leading-[0.95]" style={{ fontSize: "clamp(3.2rem, 8.5vw, 7rem)", letterSpacing: "-0.015em" }}>
            Leave room for the unexpected<span className="text-amber">.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[1.1rem] leading-relaxed text-paper/85">
            Thoughtfully equipped caravans for the freedom to travel at your own pace —
            across the Cotswolds, the South West and Wales.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="#permit" className="btn-primary !border-white/20">Check availability</Link>
            <Link href="/fleet" className="btn-secondary !bg-transparent !text-paper !border-white/40 hover:!border-white">Meet the fleet</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div ref={ref} className="relative bg-forest" style={{ height: "340vh" }} aria-label="Introduction">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true">
          <DriveScene progress={scrollYProgress} />
        </div>

        <div className="absolute inset-x-0 top-16 flex items-center justify-between p-5 font-mono text-[0.68rem] font-bold uppercase tracking-[0.2em] text-paper/85 sm:p-7 sm:pt-5">
          <span>Field log Nº 01 — Bath, Somerset</span>
          <span className="hidden sm:inline">51.3811° N, 2.3590° W</span>
          <Compass size={24} className="text-sand" />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
          <div className="relative mx-auto h-full w-full max-w-wide px-5 sm:px-8">
            <Beat progress={scrollYProgress} a={0} b={0.42}>
              <p className={KICKER}>Beat one — the idea</p>
              <h1 className="mt-3 max-w-5xl font-display leading-[0.95]" style={{ fontSize: "clamp(3.2rem, 8.5vw, 7rem)", letterSpacing: "-0.015em" }}>
                Leave room for the unexpected<span className="text-amber">.</span>
              </h1>
              <p className="mt-5 max-w-xl text-[1.1rem] leading-relaxed text-paper/85">
                Thoughtfully equipped caravans for the freedom to travel at your own pace —
                across the Cotswolds, the South West and Wales.
              </p>
            </Beat>

            <Beat progress={scrollYProgress} a={0.42} b={0.72}>
              <p className={KICKER}>Beat two — the fleet</p>
              <p className="mt-3 max-w-4xl font-display leading-[0.98]" style={{ fontSize: "clamp(2.6rem, 6vw, 5rem)" }}>
                Three vans. Miles of lanes.
              </p>
              <dl className="mt-5 grid max-w-md grid-cols-3 gap-4 border-t border-white/20 pt-4">
                <div><dt className="tick-accent">Caravans</dt><dd className="mt-1 font-display text-3xl">Three</dd></div>
                <div><dt className="tick-accent">Sleeps</dt><dd className="mt-1 font-display text-3xl">2 – 4</dd></div>
                <div><dt className="tick-accent">From</dt><dd className="mt-1 font-display text-3xl">{gbp(9500)}<span className="font-sans text-sm text-paper/60"> /nt</span></dd></div>
              </dl>
              <div className="pointer-events-auto mt-6 flex flex-wrap gap-3">
                <Link href="#permit" className="btn-primary !border-white/20">Check availability</Link>
                <Link href="/fleet" className="btn-secondary !bg-transparent !text-paper !border-white/40 hover:!border-white">Meet the fleet</Link>
              </div>
            </Beat>

            <Beat progress={scrollYProgress} a={0.72} b={1}>
              <p className={KICKER}>Beat three — departure</p>
              <p className="mt-3 font-display leading-[1.0]" style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}>
                Dep 18:40 · Lansdown → West.
              </p>
              <p className="mt-4 font-mono text-[0.72rem] font-bold uppercase tracking-[0.22em] text-paper/70">
                Lights on · Mist lifting · From {gbp(9500)}/nt
              </p>
              <p className="mt-8 font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-paper/60" aria-hidden="true">
                Release — the road continues
                <span className="mt-2 block h-8 w-px bg-paper/50" />
              </p>
            </Beat>
          </div>
        </div>

        <ul className="sr-only">
          <li>Leave room for the unexpected. Caravan hire from Bath.</li>
          <li>Three vans sleeping two to four, from £95 a night.</li>
          <li>Departures daily from Lansdown depot.</li>
        </ul>
      </div>
    </div>
  );
}
