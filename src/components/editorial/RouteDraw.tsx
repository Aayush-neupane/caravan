"use client";

import { motion, useReducedMotion } from "framer-motion";

// Editorial route timeline: a line that draws itself as the reader arrives,
// with a node per stop. Content is fully readable with animation disabled.
export function RouteDraw({ stops }: { stops: { name: string; note: string }[] }) {
  const reduce = useReducedMotion();
  return (
    <ol className="relative mt-6 space-y-0 border-t border-border">
      {stops.map((s, i) => (
        <li key={s.name} className="relative grid gap-2 border-b border-border py-6 pl-12 sm:grid-cols-12 sm:pl-14">
          <span className="absolute left-0 top-0 flex h-full w-8 items-stretch justify-center sm:w-10" aria-hidden="true">
            {i > 0 || true ? (
              <motion.span
                className="w-0.5 origin-top bg-amber"
                style={{ height: "100%" }}
                initial={reduce ? false : { scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : null}
          </span>
          <motion.span
            className="absolute left-[9px] top-7 flex h-4 w-4 items-center justify-center rounded-full border-2 border-forest bg-paper sm:left-[13px]"
            aria-hidden="true"
            initial={reduce ? false : { scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber" />
          </motion.span>
          <div className="sm:col-span-10 sm:col-start-1">
            <p className="tick-label">Stop {i + 1}</p>
            <p className="mt-1 font-display text-2xl text-charcoal">{s.name}</p>
            <p className="mt-1.5 leading-relaxed text-charcoal/85">{s.note}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
