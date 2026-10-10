"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { MiniOutfit } from "./MiniConvoy";

// Scroll-driven route strip: the pocket outfit drives from one milestone
// to the other as the strip crosses the viewport. A living divider.
export function ScrollRoute({
  from = "THE YARD",
  to = "THE FIELD",
  note = "scroll on",
  dark = false,
}: {
  from?: string;
  to?: string;
  note?: string;
  dark?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["-6%", "88%"]);
  const spin = useTransform(scrollYProgress, [0, 1], [0, 720]);
  const ink = dark ? "#EDE6D6" : "#1A2B23";

  return (
    <div ref={ref} className="relative mx-auto max-w-wide overflow-hidden px-5 sm:px-8" aria-hidden="true">
      <div className="relative h-28">
        <div className="absolute inset-x-0 top-14 border-t-2 border-dashed" style={{ borderColor: ink, opacity: 0.35 }} />
        {[8, 50, 92].map((left, i) => (
          <span
            key={left}
            className="absolute top-14 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${left}%`, background: i === 1 ? "#C9A86A" : ink }}
          />
        ))}
        <motion.div
          className="absolute top-3 w-28 sm:w-32"
          style={reduce ? { left: "50%", x: "-50%" } : { left: x, x: "-50%" }}
        >
          <MiniOutfit spin={reduce ? undefined : spin} />
        </motion.div>
        <div className="absolute inset-x-0 bottom-1 flex justify-between font-mono text-[0.66rem] font-bold uppercase tracking-[0.18em]" style={{ color: ink }}>
          <span>{from}</span>
          <span style={{ color: "#A9884E" }}>{note}</span>
          <span>{to}</span>
        </div>
      </div>
    </div>
  );
}
