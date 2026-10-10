"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Framed, SectionMarker } from "./Decor";

// The road, in frames: survey prints stacked like work on the planning table.
// Each print pins as the next slides over it — no parallax drift, so nothing
// can overlap or gap at any width. Photography only, all frames previously
// shot on our own runs.
const FRAMES = [
  {
    src: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=70",
    alt: "Open road ahead through rolling country",
    caption: "The long way, Brecon approach",
    meta: "FRAME 001 · 35MM",
    note: "Ninety minutes of towing, then the whole afternoon belongs to you. This is the stretch that taught us the two-hour rule.",
    mile: "MI 000 · LEG 1",
    width: "lg:w-[88%]",
  },
  {
    src: "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=1600&q=70",
    alt: "Caravan beside still water at golden hour",
    caption: "Still water, last light",
    meta: "FRAME 002 · 35MM",
    note: "Pitch facing west whenever the site allows it. Tea tastes better with the door open to this.",
    mile: "MI 214 · LEG 2",
    width: "lg:ml-auto lg:w-[74%]",
  },
  {
    src: "https://images.unsplash.com/photo-1516937941344-00b4e0337589?auto=format&fit=crop&w=1600&q=70",
    alt: "Caravan on open moorland under a wide sky",
    caption: "Moorland, big skies",
    meta: "FRAME 003 · 35MM",
    note: "Wind up here teaches you to double-peg the awning and love it anyway. Dark skies by nine.",
    mile: "MI 402 · LEG 3",
    width: "lg:w-[80%]",
  },
];

export function FieldStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  return (
    <section className="grain relative overflow-hidden bg-forest text-paper" aria-label="The road in frames">
      <div className="mx-auto max-w-wide px-5 pt-14 sm:px-8">
        <SectionMarker dark index="✦" kicker="Interlude — the road, in frames" coords="Shot on the survey runs" />
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.22em] text-amber">
              Survey roll 04 · 576 mi · Apr–Sep
            </p>
            <h2 className="mt-3 font-display leading-[0.98]" style={{ fontSize: "clamp(2.8rem, 6vw, 5rem)" }}>
              The road,
              <br />
              in frames.
            </h2>
          </div>
          <div className="lg:col-span-4 lg:col-start-9 lg:self-end">
            <blockquote className="border-l-2 border-amber pl-4 font-display text-xl italic leading-snug text-paper/90">
              “We drive every route before we publish it — same vans, same lanes, no staged shots.”
            </blockquote>
            <p className="mt-3 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-paper/50">— Field log, survey run 04</p>
          </div>
        </div>
      </div>

      <div ref={ref} className="mx-auto max-w-wide space-y-[14vh] px-5 py-16 sm:px-8 lg:pb-[12vh]">
        {FRAMES.map((f, i) => (
          <div key={f.src} className="sticky" style={{ top: 88 + i * 32 }}>
            {reduce ? (
              <div className={f.width}>
                <PrintCard f={f} i={i} />
              </div>
            ) : (
              <motion.div
                className={f.width}
                initial={{ opacity: 0, y: 56 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-72px" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <PrintCard f={f} i={i} />
              </motion.div>
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

function PrintCard({ f, i }: { f: (typeof FRAMES)[number]; i: number }) {
  return (
    <article className="border border-white/15 bg-forestDeep p-3 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)] sm:p-4" style={{ borderRadius: 10 }}>
      <div className="flex items-baseline justify-between gap-3 px-1 pb-3">
        <span
          aria-hidden="true"
          className="font-display text-5xl leading-none sm:text-6xl"
          style={{ color: "transparent", WebkitTextStroke: "1px #C9A86A" }}
        >
          {`0${i + 1}`}
        </span>
        <span className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.2em] text-paper/50">{f.mile}</span>
      </div>
      <Framed src={f.src} alt={f.alt} caption={f.caption} meta={f.meta} ratio="aspect-[16/10]" radius={6} />
      <p className="max-w-2xl px-1 pb-1 pt-4 font-display text-xl italic leading-snug text-paper/90">{f.note}</p>
    </article>
  );
}
