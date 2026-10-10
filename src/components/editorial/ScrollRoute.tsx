"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { MiniOutfit, RoadStrip } from "./MiniConvoy";

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
  const [isSmall, setIsSmall] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsSmall(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  // Small screens (like reduced-motion visitors) get the strip without the
  // scroll-driven spin — the outfit simply waits mid-road.
  const still = reduce || isSmall;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["-6%", "88%"]);
  const spin = useTransform(scrollYProgress, [0, 1], [0, 720]);
  const ink = dark ? "#EDE6D6" : "#1A2B23";

  return (
    <div ref={ref} className="relative mx-auto max-w-wide overflow-hidden px-5 sm:px-8" aria-hidden="true">
      <div className="relative h-32">
        <div className="absolute inset-x-0 top-8">
          <RoadStrip />
        </div>
        {[8, 50, 92].map((left, i) => (
          <span
            key={left}
            className="absolute rounded-full"
            style={{ left: `${left}%`, top: 54, width: 12, height: 12, transform: "translate(-50%,-50%)", background: i === 1 ? "#C9A86A" : ink }}
          />
        ))}
        <motion.div
          className="absolute w-28 sm:w-32"
          style={still ? { left: "50%", top: 33, x: "-50%" } : { left: x, top: 33, x: "-50%" }}
        >
          <MiniOutfit spin={still ? undefined : spin} />
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
