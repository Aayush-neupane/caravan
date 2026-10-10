"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-64px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  kicker,
  title,
  lede,
  dark = false,
}: {
  kicker: string;
  title: string;
  lede?: string;
  dark?: boolean;
}) {
  return (
    <div className="max-w-2xl">
      <p className={`tick-label ${dark ? "text-sand/70" : ""}`}>{kicker}</p>
      <h2
        className={`mt-3 font-display text-3xl leading-[1.08] sm:text-[2.6rem] ${dark ? "text-paper" : "text-charcoal"}`}
        style={{ letterSpacing: "-0.01em" }}
      >
        {title}
      </h2>
      {lede ? (
        <p className={`mt-4 text-[1.02rem] leading-relaxed ${dark ? "text-paper/80" : "text-muted"}`}>{lede}</p>
      ) : null}
    </div>
  );
}
