"use client";

import { useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { gbp } from "@/lib/format";
import { Compass } from "./Decor";
import { DriveScene } from "./DriveScene";

const KICKER = "font-mono text-[0.68rem] font-bold uppercase tracking-[0.22em] text-amber";

// Pinned departure: the familiar headline stays put while the outfit pulls
// away from the left, uncovering the line it was parked over. The page
// holds until the reveal completes, then releases.
export function CinematicHero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const cueOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);
  const [leaving, setLeaving] = useState(false);

  const go = (href: string) => {
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = href;
    }
  };

  // CTA clicks first drive the pin out to its end at normal travelling speed,
  // then navigate. Reduced-motion (or an already-finishing click) keeps
  // default behaviour. Constant velocity — no fast-forward: the send-off
  // plays exactly as a calm manual scroll would.
  function finishAndGo(e: ReactMouseEvent, href: string) {
    if (reduce || leaving) return;
    const el = ref.current;
    if (!el) return;
    e.preventDefault();
    const start = window.scrollY;
    const pinTop = el.getBoundingClientRect().top + start;
    const target = Math.max(start, pinTop + el.offsetHeight - window.innerHeight);
    const remaining = target - start;
    if (remaining < 8) {
      go(href);
      return;
    }
    setLeaving(true);
    // ~3s for a full pin at a brisk travelling pace, proportional when
    // part-driven. Constant velocity — no fast-forward easing.
    const total = el.offsetHeight - window.innerHeight;
    const dur = Math.min(3000, Math.max(1200, (remaining / Math.max(1, total)) * 3000));
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      window.scrollTo(0, start + remaining * k);
      if (k < 1) requestAnimationFrame(step);
      else go(href);
    };
    requestAnimationFrame(step);
  }

  const body = (
    <>
      <h1 className="mt-3 max-w-5xl font-display leading-[0.95] text-paper" style={{ fontSize: "clamp(3.2rem, 8.5vw, 7rem)", letterSpacing: "-0.015em" }}>
        Leave room for the unexpected<span className="text-amber">.</span>
      </h1>
      <p className="mt-5 max-w-xl text-[1.1rem] leading-relaxed text-paper/85">
        Thoughtfully equipped caravans for the freedom to travel at your own pace —
        across the Cotswolds, the South West and Wales.
      </p>
      <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="flex flex-wrap gap-3">
          <Link href="#permit" onClick={(e) => finishAndGo(e, "#permit")} className="btn-primary !border-white/20">Check availability</Link>
          <Link href="/fleet" onClick={(e) => finishAndGo(e, "/fleet")} className="btn-secondary !bg-transparent !text-paper !border-white/40 hover:!border-white">Meet the fleet</Link>
        </div>
        <p className="font-display text-xl text-paper">From {gbp(9500)} <span className="font-sans text-sm text-paper/60">/ night · sleeps 2–4</span></p>
      </div>
    </>
  );

  // Reduced-motion has no top strip, so it keeps its own kicker line.
  // The pinned scene shows the kicker in the top strip — body stays single.
  const copy = (
    <>
      <p className={KICKER}>Field log Nº 01 — Bath, Somerset</p>
      {body}
    </>
  );

  if (reduce) {
    return (
      <section className="relative flex min-h-[108svh] items-center overflow-hidden bg-forest text-paper" aria-label="Introduction">
        <div className="absolute inset-0" aria-hidden="true">
          <DriveScene />
        </div>
        <div className="relative z-[2] mx-auto w-full max-w-wide px-5 py-32 sm:px-8">{copy}</div>
      </section>
    );
  }

  return (
    <div ref={ref} className="relative bg-forest text-paper" style={{ height: "240vh" }} aria-label="Introduction">
      <div className="sticky top-0 flex h-svh flex-col justify-end overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true">
          <DriveScene progress={scrollYProgress} />
        </div>

        <div className="absolute inset-x-0 top-16 flex items-center justify-between p-5 font-mono text-[0.68rem] font-bold uppercase tracking-[0.2em] text-paper/85 sm:p-7 sm:pt-5">
          <span>Field log Nº 01 — Bath, Somerset</span>
          <span className="hidden sm:inline">51.3811° N, 2.3590° W</span>
          <Compass size={24} className="text-sand" />
        </div>

        <div className="relative z-[2] mx-auto flex min-h-svh w-full max-w-wide flex-col justify-center px-5 pb-56 pt-32 sm:px-8">
          {body}
        </div>

        <motion.p
          style={{ opacity: cueOpacity }}
          className="absolute bottom-6 right-5 z-[2] font-mono text-[0.66rem] font-bold uppercase tracking-[0.24em] text-paper/70 sm:right-8"
          aria-hidden="true"
        >
          Scroll — the van pulls away
        </motion.p>

        <ul className="sr-only">
          <li>Leave room for the unexpected. Caravan hire from Bath.</li>
          <li>Tow out at golden hour.</li>
        </ul>
      </div>
    </div>
  );
}
