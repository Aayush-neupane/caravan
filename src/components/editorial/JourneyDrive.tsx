"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { MiniOutfit } from "./MiniConvoy";

const LEGS = [
  {
    miles: "28",
    route: "Bath → Cotswolds",
    title: "First tow, easy lanes.",
    body: "Mirrors out at Lansdown, shakedown leg to Castle Combe, tea by the water at Bibury. Short days, long views.",
  },
  {
    miles: "60",
    route: "Bath → Brecon",
    title: "Waterfalls by day.",
    body: "Provision in Abergavenny, reservoirs by afternoon, and after 10pm look up — the dark-sky reserve does the rest.",
  },
  {
    miles: "180",
    route: "Bath → St Davids",
    title: "The long leg west.",
    body: "Early start, service stop at Cardiff Gate, surf beaches by evening. Sea air, cliff paths, harbour supper.",
  },
];

function band(progress: MotionValue<number>, a: number, b: number) {
  const opacity = useTransform(progress, [Math.max(0, a - 0.07), a, b, Math.min(1, b + 0.07)], [0, 1, 1, 0]);
  const y = useTransform(progress, [a, Math.min(1, a + 0.08), Math.max(0, b - 0.08), b], [28, 0, 0, -28]);
  return { opacity, y };
}

function LegPanel({ progress, index, leg }: { progress: MotionValue<number>; index: number; leg: (typeof LEGS)[number] }) {
  const a = index / LEGS.length;
  const b = (index + 1) / LEGS.length;
  const { opacity, y } = band(progress, a, b);
  return (
    <motion.div style={{ opacity, y }} className="absolute inset-x-0 bottom-0">
      <p className="font-display text-6xl text-amber sm:text-7xl">{leg.miles}<span className="font-sans text-base text-paper/60"> mi</span></p>
      <p className="mt-1 font-mono text-[0.7rem] font-bold uppercase tracking-[0.2em] text-paper/85">{leg.route}</p>
      <p className="mt-2 font-display text-2xl sm:text-3xl">{leg.title}</p>
      <p className="mt-2 max-w-md text-[0.95rem] leading-relaxed text-paper/70">{leg.body}</p>
    </motion.div>
  );
}

function GhostNumeral({ progress, index, miles }: { progress: MotionValue<number>; index: number; miles: string }) {
  const a = index / LEGS.length;
  const b = (index + 1) / LEGS.length;
  const opacity = useTransform(progress, [Math.max(0, a - 0.07), a, b, Math.min(1, b + 0.07)], [0, 0.5, 0.5, 0]);
  return (
    <motion.span style={{ opacity }} className="ghost-word ghost-word-dark pointer-events-none absolute -top-6 right-0 text-[26vw] font-bold lg:text-[20rem]" aria-hidden="true">
      {miles}
    </motion.span>
  );
}

// Pinned journey: the page holds while the outfit drives leg to leg and
// each leg's text reveals as the van reaches its milestone.
export function JourneyDrive() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const left = useTransform(scrollYProgress, [0, 1], ["6%", "82%"]);
  const spin = useTransform(scrollYProgress, [0, 1], [0, 1440]);

  if (reduce) {
    return (
      <section className="bg-forest text-paper" aria-label="The journey in three legs">
        <div className="mx-auto max-w-wide px-5 py-16 sm:px-8">
          <p className="tick-accent" style={{ color: "#C9A86A" }}>The journey — three legs</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {LEGS.map((leg) => (
              <div key={leg.route} className="border border-white/15 bg-forestDeep p-6" style={{ borderRadius: 10 }}>
                <p className="font-display text-5xl text-amber">{leg.miles}<span className="font-sans text-sm text-paper/60"> mi</span></p>
                <p className="mt-1 font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] text-paper/80">{leg.route}</p>
                <p className="mt-2 font-display text-2xl">{leg.title}</p>
                <p className="mt-2 text-[0.9rem] text-paper/70">{leg.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div ref={ref} className="relative bg-forest" style={{ height: "320vh" }}>
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        <div className="mx-auto w-full max-w-wide px-5 pt-24 sm:px-8">
          <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.22em] text-amber">The journey — three legs</p>
          <p className="mt-1 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-paper/50" aria-hidden="true">Keep scrolling — the page holds until the last mile</p>
        </div>

        {/* road + milestones + outfit */}
        <div className="relative mx-auto mt-6 w-full max-w-wide flex-1 px-5 sm:px-8" aria-hidden="true">
          <div className="absolute inset-x-5 top-16 border-t-2 border-dashed border-paper/30 sm:inset-x-8" />
          {[
            { at: "20%", label: "COTSWOLDS" },
            { at: "50%", label: "BRECON" },
            { at: "80%", label: "ST DAVIDS" },
          ].map((m) => (
            <div key={m.label} className="absolute top-16 -translate-x-1/2" style={{ left: m.at }}>
              <span className="mx-auto block h-3.5 w-3.5 rounded-full bg-amber" />
              <span className="mt-2 block whitespace-nowrap font-mono text-[0.62rem] font-bold uppercase tracking-[0.16em] text-paper/70">{m.label}</span>
            </div>
          ))}
          <motion.div className="absolute top-4 w-32 sm:w-40" style={{ left, x: "-50%" }}>
            <MiniOutfit spin={spin} />
          </motion.div>
          {LEGS.map((leg, i) => (
            <GhostNumeral key={leg.route} progress={scrollYProgress} index={i} miles={leg.miles} />
          ))}
        </div>

        {/* revealing text */}
        <div className="relative mx-auto w-full max-w-wide flex-1 px-5 pb-10 sm:px-8">
          <ul className="sr-only">
            {LEGS.map((leg) => (
              <li key={leg.route}>{leg.miles} miles: {leg.route} — {leg.title} {leg.body}</li>
            ))}
          </ul>
          <div className="relative h-full min-h-64" aria-hidden="true">
            {LEGS.map((leg, i) => (
              <LegPanel key={leg.route} progress={scrollYProgress} index={i} leg={leg} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
