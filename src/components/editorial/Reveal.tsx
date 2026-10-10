"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// CSS-driven reveal: one shared keyframe (see globals.css) plus an
// IntersectionObserver — no per-element motion runtime, and nothing moves
// when the visitor prefers reduced motion.
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -64px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className ?? ""} ${shown ? "animate-fade-up" : "opacity-0"}`}
      style={shown && delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
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
