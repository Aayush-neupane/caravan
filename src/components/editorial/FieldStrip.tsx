"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Reveal } from "./Reveal";
import { Framed, SectionMarker } from "./Decor";

// The road, in frames: an asymmetric photo collage where each frame
// drifts at its own speed as you scroll. Pure photography, no cartoons.
const FRAMES = [
  {
    src: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=70",
    alt: "Caravan parked beside a pine forest at dawn",
    caption: "Pine forest, first light",
    meta: "FRAME 002 · COTSWOLDS",
    span: "lg:col-span-5",
    ratio: "aspect-[4/5]",
  },
  {
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=70",
    alt: "Atlantic surf on the Pembrokeshire coast",
    caption: "Atlantic surf, St Davids",
    meta: "FRAME 003 · PEMBROKESHIRE",
    span: "lg:col-span-4 lg:col-start-8 lg:mt-28",
    ratio: "aspect-[4/5]",
  },
  {
    src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=70",
    alt: "Mist over Brecon reservoirs at dusk",
    caption: "Reservoirs at dusk, Brecon",
    meta: "FRAME 004 · DARK SKIES",
    span: "lg:col-span-5 lg:col-start-3 lg:-mt-16",
    ratio: "aspect-[16/11]",
  },
];

const LEGS: [string, string, string][] = [
  ["28", "Bath → Cotswolds", "Lanes, farm shops, escarpment skies."],
  ["60", "Bath → Brecon", "Reservoirs, waterfalls, dark skies."],
  ["180", "Bath → St Davids", "The long leg. Early start, sea air."],
];

export function FieldStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yA = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const yB = useTransform(scrollYProgress, [0, 1], [-30, 50]);
  const yC = useTransform(scrollYProgress, [0, 1], [70, -70]);
  const drifts = [yA, yB, yC];

  return (
    <section className="grain relative overflow-hidden bg-forest text-paper" aria-label="The road in frames">
      <div className="mx-auto max-w-wide px-5 pt-14 sm:px-8">
        <SectionMarker dark index="✦" kicker="Interlude — the road, in frames" coords="Shot on the survey runs" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="max-w-xl font-display text-4xl leading-[1.02] sm:text-5xl">Three runs that made the itineraries.</h2>
          <p className="max-w-sm text-[0.95rem] leading-relaxed text-paper/70">
            We drive every route before we publish it. These frames are from the survey runs — same vans, same lanes.
          </p>
        </div>
      </div>

      <div ref={ref} className="mx-auto grid max-w-wide gap-6 px-5 py-12 sm:px-8 lg:grid-cols-12">
        {FRAMES.map((f, i) =>
          reduce ? (
            <div key={f.src} className={f.span}>
              <Framed src={f.src} alt={f.alt} caption={f.caption} meta={f.meta} ratio={f.ratio} radius={6} />
            </div>
          ) : (
            <motion.div key={f.src} className={f.span} style={{ y: drifts[i] }}>
              <Framed src={f.src} alt={f.alt} caption={f.caption} meta={f.meta} ratio={f.ratio} radius={6} />
            </motion.div>
          )
        )}
      </div>

      <div className="mx-auto grid max-w-wide gap-4 px-5 pb-16 sm:grid-cols-3 sm:px-8">
        {LEGS.map(([miles, route, note], i) => (
          <Reveal key={route} delay={i * 0.08}>
            <div className="border border-white/15 bg-forestDeep p-5" style={{ borderRadius: 10 }}>
              <p className="font-display text-5xl text-amber">{miles}<span className="font-sans text-sm text-paper/60"> mi</span></p>
              <p className="mt-1 font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] text-paper/80">{route}</p>
              <p className="mt-2 text-[0.88rem] text-paper/65">{note}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
