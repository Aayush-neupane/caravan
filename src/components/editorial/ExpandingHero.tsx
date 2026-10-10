"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { gbp } from "@/lib/format";
import { Compass } from "./Decor";

// Scroll-expanding cinema frame: a rounded inset frame that grows to
// full-bleed as the visitor scrolls the opening. Static full hero when
// reduced motion is preferred. Booking stays one tap away throughout.
export function ExpandingHero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const frameW = useTransform(scrollYProgress, [0, 1], ["80%", "100%"]);
  const frameH = useTransform(scrollYProgress, [0, 1], ["64vh", "100vh"]);
  const radius = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const captionY = useTransform(scrollYProgress, [0, 0.6], [0, -30]);
  const captionOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);

  if (reduce) {
    return (
      <section className="relative flex min-h-[92vh] items-end overflow-hidden bg-forest text-paper" aria-label="Introduction">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=2200&q=75"
          alt="Caravan pitched beside still water at dawn"
          className="absolute inset-0 h-full w-full object-cover opacity-90"
          loading="eager"
        />
        <div className="absolute inset-0" style={{ background: "rgba(18,32,25,0.55)" }} />
        <HeroCopy />
      </section>
    );
  }

  return (
    <div ref={ref} className="relative bg-forest" style={{ height: "210vh" }} aria-label="Introduction">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <motion.div
          style={{ width: frameW, height: frameH, borderRadius: radius }}
          className="relative overflow-hidden"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=2200&q=75"
            alt="Caravan pitched beside still water at dawn"
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            initial={{ scale: 1.12 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="absolute inset-0" style={{ background: "rgba(18,32,25,0.5)" }} />
          {/* viewfinder chrome */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5 font-mono text-[0.68rem] font-bold uppercase tracking-[0.2em] text-paper/80 sm:p-7">
            <span>Field log Nº 01</span>
            <span className="hidden sm:inline">51.3811° N, 2.3590° W</span>
            <Compass size={24} className="text-sand" />
          </div>
          <motion.div style={{ y: captionY, opacity: captionOpacity }} className="absolute inset-x-0 bottom-0 p-5 sm:p-10">
            <HeroCopy />
          </motion.div>
        </motion.div>
        {/* scroll cue */}
        <motion.div
          style={{ opacity: captionOpacity }}
          className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-paper/70"
          aria-hidden="true"
        >
          Scroll
          <span className="mx-auto mt-2 block h-8 w-px bg-paper/50" />
        </motion.div>
      </div>
    </div>
  );
}

function HeroCopy() {
  return (
    <div className="max-w-4xl text-paper">
      <h1 className="font-display leading-[0.95]" style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)", letterSpacing: "-0.015em" }}>
        Leave room for the unexpected.
      </h1>
      <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-paper/85">
        Thoughtfully equipped caravans for the freedom to travel at your own pace —
        across the Cotswolds, the South West and Wales.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="flex flex-wrap gap-3">
          <Link href="#permit" className="btn-primary !border-white/20">Check availability</Link>
          <Link href="/fleet" className="btn-secondary !bg-transparent !text-paper !border-white/40 hover:!border-white">Meet the fleet</Link>
        </div>
        <p className="font-display text-xl">From {gbp(9500)} <span className="font-sans text-sm text-paper/60">/ night · sleeps 2–4</span></p>
      </div>
    </div>
  );
}
