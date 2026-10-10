"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Framed, SectionMarker } from "./Decor";

// The road, in frames: an asymmetric survey-roll collage. Each frame carries
// its plate number, leg mileage and a logbook note; frames drift gently on
// desktop only (stacked mobile never parallaxes — drift there only overlaps).
const FRAMES = [
  {
    src: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=70",
    alt: "Caravan parked beside a pine forest at dawn",
    caption: "Pine forest, first light",
    meta: "FRAME 002 · COTSWOLDS",
    note: "Dawn recce before the lanes woke — dew on the awning, kettle first.",
    mile: "MI 000 · LEG 1",
    span: "lg:col-span-5",
    ratio: "aspect-[4/5]",
  },
  {
    src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=70",
    alt: "Atlantic surf on the Pembrokeshire coast",
    caption: "Atlantic surf, St Davids",
    meta: "FRAME 003 · PEMBROKESHIRE",
    note: "Salt on the lenses by noon. The windbreaks earned their keep.",
    mile: "MI 214 · LEG 2",
    span: "lg:col-span-4 lg:col-start-8 lg:mt-24",
    ratio: "aspect-[4/5]",
  },
  {
    src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=70",
    alt: "Mist over Brecon reservoirs at dusk",
    caption: "Reservoirs at dusk, Brecon",
    meta: "FRAME 004 · DARK SKIES",
    note: "Last light over the water, then dark skies by nine.",
    mile: "MI 402 · LEG 3",
    span: "lg:col-span-5 lg:col-start-3 lg:-mt-12",
    ratio: "aspect-[16/11]",
  },
];

function useDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const set = () => setDesktop(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  return desktop;
}

export function FieldStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const desktop = useDesktop();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yA = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const yB = useTransform(scrollYProgress, [0, 1], [-24, 30]);
  const yC = useTransform(scrollYProgress, [0, 1], [36, -36]);
  const drifts = [yA, yB, yC];
  const animate = !reduce && desktop;

  const block = (f: (typeof FRAMES)[number], i: number) => (
    <>
      <div className="mb-3 flex items-baseline justify-between">
        <span
          aria-hidden="true"
          className="font-display text-5xl leading-none"
          style={{ color: "transparent", WebkitTextStroke: "1px #C9A86A" }}
        >
          {`0${i + 1}`}
        </span>
        <span className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.2em] text-paper/50">{f.mile}</span>
      </div>
      <Framed src={f.src} alt={f.alt} caption={f.caption} meta={f.meta} ratio={f.ratio} radius={6} />
      <p className="mt-3 max-w-md text-[0.92rem] leading-relaxed text-paper/70">{f.note}</p>
    </>
  );

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
        <p className="mt-4 font-mono text-[0.68rem] font-bold uppercase tracking-[0.22em] text-amber">
          Survey roll 04 · 576 mi · Apr–Sep · 35mm
        </p>
      </div>

      <div ref={ref} className="mx-auto grid max-w-wide gap-10 px-5 py-12 sm:px-8 lg:grid-cols-12 lg:gap-6">
        {FRAMES.map((f, i) => (
          <div key={f.src} className={f.span}>
            {i > 0 && (
              <div aria-hidden="true" className="mb-10 flex items-center gap-3 lg:hidden">
                <span className="h-px flex-1 bg-white/15" />
                <span className="font-mono text-[0.64rem] font-bold uppercase tracking-[0.2em] text-amber">✦ {f.mile}</span>
                <span className="h-px flex-1 bg-white/15" />
              </div>
            )}
            {animate ? (
              <motion.div style={{ y: drifts[i] }}>{block(f, i)}</motion.div>
            ) : (
              <div>{block(f, i)}</div>
            )}
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-wide px-5 pb-14 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-4 font-mono text-[0.66rem] font-bold uppercase tracking-[0.2em] text-paper/50">
          <span>End of roll — 576 mi surveyed · three runs · nothing staged</span>
          <span className="text-amber">Continues — our promise ↓</span>
        </div>
      </div>
    </section>
  );
}
