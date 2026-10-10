"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, type MotionValue } from "framer-motion";

const SAND = "#EDE6D6";
const INK = "#0C1712";
const FOREST = "#1A2B23";
const AMBER = "#C9A86A";

// Pocket-size outfit: car leads right, caravan trails. Wheels spin in place
// about their hubs via native SVG rotation (never orbit).

function MiniWheel({ cx, spin }: { cx: number; spin?: MotionValue<number> }) {
  const fallback = useMotionValue(0);
  const active = spin ?? fallback;
  const gRef = useRef<SVGGElement>(null);
  useMotionValueEvent(active, "change", (v) => {
    gRef.current?.setAttribute("transform", `rotate(${v} ${cx} 34)`);
  });
  return (
    <g>
      <circle cx={cx} cy={34} r={9} fill={INK} stroke={SAND} strokeWidth={2} />
      <g ref={gRef}>
        <g stroke={SAND} strokeWidth={1.6}>
          <line x1={cx - 6} y1={34} x2={cx + 6} y2={34} />
          <line x1={cx - 3} y1={34 - 5.2} x2={cx + 3} y2={34 + 5.2} />
          <line x1={cx - 3} y1={34 + 5.2} x2={cx + 3} y2={34 - 5.2} />
        </g>
        <circle cx={cx} cy={34} r={2} fill={AMBER} />
      </g>
    </g>
  );
}

export function MiniOutfit({ spin, flag = false }: { spin?: MotionValue<number>; flag?: boolean }) {
  return (
    <svg viewBox="0 0 180 48" className="h-auto w-full" role="presentation" aria-hidden={!flag}>
      {/* caravan */}
      <rect x={2} y={6} width={92} height={30} rx={3} fill={SAND} />
      <rect x={2} y={28} width={92} height={8} fill={FOREST} />
      <rect x={2} y={26} width={92} height={2} fill={AMBER} />
      <rect x={9} y={11} width={16} height={11} fill={AMBER} />
      <rect x={29} y={11} width={16} height={11} fill={AMBER} />
      <rect x={52} y={11} width={13} height={25} fill="none" stroke={FOREST} strokeWidth={1.6} />
      <rect x={76} y={14} width={12} height={22} rx={2} fill="none" stroke={FOREST} strokeWidth={1.6} />
      <line x1={94} y1={24} x2={106} y2={24} stroke={SAND} strokeWidth={2.5} />
      {/* car */}
      <path d="M106,36 L106,26 Q106,23 109,23 L122,23 L131,14 Q132,13 134,13 L152,13 Q154,13 156,15 L162,23 L174,23 Q177,23 177,26 L177,36 Z" fill={SAND} />
      <path d="M133,16 L151,16 L156,22 L128,22 Z" fill={FOREST} />
      <rect x={174} y={27} width={3} height={5} fill={AMBER} />
      {flag && (
        <g>
          <line x1={48} y1={6} x2={48} y2={-8} stroke={SAND} strokeWidth={2} />
          <polygon points="48,-8 64,-4 48,0" fill={AMBER} />
        </g>
      )}
      <MiniWheel cx={22} spin={spin} />
      <MiniWheel cx={72} spin={spin} />
      <MiniWheel cx={124} spin={spin} />
      <MiniWheel cx={160} spin={spin} />
    </svg>
  );
}

// Booking stepper: the outfit drives to the current step.
export function RouteProgress({ step, labels }: { step: number; labels: string[] }) {
  const n = labels.length;
  const angle = useMotionValue(step * 360);
  const at = (i: number) => `${10 + (i * 80) / Math.max(1, n - 1)}%`;

  useEffect(() => {
    const controls = animate(angle, step * 360 + 360, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onComplete: () => angle.set(step * 360),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <div>
      <div className="relative h-[4.5rem]" aria-hidden="true">
        <div className="absolute inset-x-0 top-9 border-t-2 border-dashed border-forest/30" />
        {labels.map((_, i) => (
          <span
            key={i}
            className={`absolute top-9 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 ${
              i < step ? "border-forest bg-forest" : i === step ? "border-forest bg-amber" : "border-border bg-white"
            }`}
            style={{ left: at(i) }}
          >
            {i < step && (
              <svg width={9} height={9} viewBox="0 0 10 10"><path d="M2 5.2l2.2 2.2L8 3.2" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" /></svg>
            )}
          </span>
        ))}
        <motion.div
          className="absolute top-1 w-24 sm:w-28"
          initial={false}
          animate={{ left: at(step) }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ x: "-50%" }}
        >
          <MiniOutfit spin={angle} />
        </motion.div>
      </div>
      <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }} aria-label="Booking progress">
        {labels.map((s, i) => (
          <li
            key={s}
            aria-current={i === step ? "step" : undefined}
            className={`border px-2 py-2 text-center text-[0.78rem] font-semibold transition-colors ${
              i === step ? "border-forest bg-forest text-white" : i < step ? "border-forest/40 bg-white text-forest" : "border-border bg-white text-muted"
            }`}
            style={{ borderRadius: 8 }}
          >
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}
