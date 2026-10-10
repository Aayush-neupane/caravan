"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Reveal } from "./Reveal";
import { SectionMarker } from "./Decor";

const SAND = "#EDE6D6";
const INK = "#0C1712";
const FOREST = "#1A2B23";
const DEEP = "#122019";
const AMBER = "#C9A86A";

function Wheel({ cx, cy, spin }: { cx: number; cy: number; spin?: ReturnType<typeof useTransform<number, number>> }) {
  const inner = (
    <g>
      <circle cx={cx} cy={cy} r={13} fill={INK} stroke={SAND} strokeWidth={2.5} />
      <g stroke={SAND} strokeWidth={2}>
        <line x1={cx - 8} y1={cy} x2={cx + 8} y2={cy} />
        <line x1={cx} y1={cy - 8} x2={cx} y2={cy + 8} />
      </g>
      <circle cx={cx} cy={cy} r={3} fill={AMBER} />
    </g>
  );
  if (!spin) return <g>{inner}</g>;
  return (
    <motion.g style={{ rotate: spin, transformBox: "fill-box", transformOrigin: "center" }}>
      {inner}
    </motion.g>
  );
}

function Convoy({ drive, spin }: { drive: ReturnType<typeof useTransform<number, number>> | number; spin?: ReturnType<typeof useTransform<number, number>> }) {
  return (
    <motion.g style={typeof drive === "number" ? { x: drive } : { x: drive }}>
      {/* tow car */}
      <path
        d="M0,64 L0,40 Q0,34 6,34 L34,34 L52,16 Q54,13 58,13 L92,13 Q96,13 99,16 L112,32 L142,32 Q148,32 148,38 L148,64 Z"
        fill={SAND}
      />
      <path d="M56,18 L90,18 L100,30 L48,30 Z" fill={FOREST} />
      <rect x={104} y={38} width={10} height={5} fill={AMBER} />
      {/* hitch */}
      <line x1={148} y1={52} x2={168} y2={52} stroke={SAND} strokeWidth={4} />
      {/* caravan */}
      <rect x={168} y={18} width={150} height={46} rx={4} fill={SAND} />
      <rect x={180} y={28} width={34} height={20} fill={FOREST} />
      <rect x={222} y={28} width={34} height={20} fill={FOREST} />
      <rect x={264} y={28} width={26} height={36} fill="none" stroke={FOREST} strokeWidth={2.5} />
      <rect x={168} y={56} width={150} height={4} fill={AMBER} />
      <circle cx={312} cy={40} r={3} fill={AMBER} />
      <Wheel cx={36} cy={64} spin={spin} />
      <Wheel cx={116} cy={64} spin={spin} />
      <Wheel cx={200} cy={64} spin={spin} />
      <Wheel cx={286} cy={64} spin={spin} />
    </motion.g>
  );
}

const LEGS: [string, string, string][] = [
  ["28", "Bath → Cotswolds", "Lanes, farm shops, escarpment skies."],
  ["60", "Bath → Brecon", "Reservoirs, waterfalls, dark skies."],
  ["180", "Bath → St Davids", "The long leg. Early start, sea air."],
];

const POSTS = [
  { x: 120, label: "BATH · 0" },
  { x: 470, label: "COTSWOLDS · 28" },
  { x: 800, label: "BRECON · 60" },
  { x: 1090, label: "ST DAVIDS · 180" },
];

export function ConvoyStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const drive = useTransform(scrollYProgress, [0, 1], [-380, 1240]);
  const towerX = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const spin = useTransform(scrollYProgress, [0, 1], [0, 900]);

  return (
    <section className="grain relative overflow-hidden bg-forest text-paper" aria-label="The convoy">
      <div className="mx-auto max-w-wide px-5 pt-14 sm:px-8">
        <SectionMarker dark index="✦" kicker="Interlude — the convoy rolls" coords="Scroll — the van drives itself" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="max-w-xl font-display text-4xl leading-[1.02] sm:text-5xl">Tow out as the mist lifts.</h2>
          <p className="max-w-sm text-[0.95rem] leading-relaxed text-paper/70">
            Every hire leaves Lansdown the same way: mirrors out, noseweight set, and the whole road ahead.
          </p>
        </div>
      </div>

      <div ref={ref}>
        <svg viewBox="0 0 1200 430" className="mt-4 block h-auto w-full" role="img" aria-label="Illustration: a tow car and caravan driving past a stone tower as you scroll">
          {/* stars */}
          {[
            [80, 40], [200, 90], [340, 36], [480, 70], [620, 30], [740, 80], [880, 36], [1020, 70], [1120, 30], [260, 130], [560, 120], [980, 140],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={1.6} fill={SAND} opacity={0.4} />
          ))}
          {/* sun */}
          <circle cx={950} cy={118} r={58} fill="none" stroke={AMBER} strokeOpacity={0.35} strokeWidth={1.5} />
          <circle cx={950} cy={118} r={42} fill={AMBER} />
          {/* birds */}
          <g stroke={SAND} strokeOpacity={0.55} strokeWidth={2} fill="none" strokeLinecap="round">
            <path d="M170,100 q9,-9 18,0 q9,-9 18,0" />
            <path d="M240,132 q7,-7 14,0 q7,-7 14,0" />
          </g>
          {/* far hills */}
          <path d="M0,300 C160,230 320,290 480,250 C640,210 800,280 960,240 C1060,218 1140,240 1200,228 L1200,430 L0,430 Z" fill={DEEP} />
          {/* tower hill + tower (parallax) */}
          <motion.g style={reduce ? undefined : { x: towerX }}>
            <ellipse cx={840} cy={330} rx={150} ry={36} fill={INK} />
            <g transform="translate(805,130)">
              <path d="M10,200 L16,70 L54,70 L60,200 Z" fill={SAND} />
              <rect x={12} y={56} width={9} height={14} fill={SAND} />
              <rect x={30} y={56} width={9} height={14} fill={SAND} />
              <rect x={48} y={56} width={9} height={14} fill={SAND} />
              <rect x={29} y={100} width={12} height={24} rx={6} fill={FOREST} />
              <path d="M25,200 L25,178 Q25,168 35,168 Q45,168 45,178 L45,200 Z" fill={FOREST} />
              <line x1={35} y1={56} x2={35} y2={34} stroke={SAND} strokeWidth={3} />
              <polygon points="35,34 64,41 35,48" fill={AMBER} />
            </g>
          </motion.g>
          {/* road */}
          <rect x={0} y={330} width={1200} height={64} fill={INK} />
          <line x1={0} y1={362} x2={1200} y2={362} stroke={SAND} strokeOpacity={0.75} strokeWidth={2.5} strokeDasharray="26 20" />
          {/* milestones */}
          {POSTS.map((p) => (
            <g key={p.label}>
              <rect x={p.x} y={288} width={8} height={44} fill={SAND} />
              <rect x={p.x - 4} y={282} width={16} height={7} fill={AMBER} />
              <text x={p.x + 14} y={296} fontSize={13} fontWeight={800} fontFamily="Manrope, sans-serif" fill={SAND} letterSpacing={1.5}>
                {p.label}
              </text>
            </g>
          ))}
          {/* the convoy */}
          <g transform="translate(0,278)">
            {reduce ? (
              <Convoy drive={620} />
            ) : (
              <Convoy drive={drive} spin={spin} />
            )}
          </g>
          {/* foreground grass */}
          <g stroke={SAND} strokeOpacity={0.35} strokeWidth={2} strokeLinecap="round">
            <path d="M60,410 l0,-12 M72,410 l-4,-10 M1100,414 l0,-12 M1112,414 l4,-10 M540,418 l0,-10 M552,418 l-4,-9" />
          </g>
        </svg>
      </div>

      <div className="mx-auto grid max-w-wide gap-4 px-5 pb-16 sm:grid-cols-3 sm:px-8">
        {LEGS.map(([miles, route, note], i) => (
          <Reveal key={route} delay={i * 0.08}>
            <div className="border border-white/15 bg-forestDeep p-5" style={{ borderRadius: 10 }}>
              <p className="font-display text-5xl text-amber">{miles}<span className="font-sans text-sm text-paper/60"> mi</span></p>
              <p className="mt-1 font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] text-paper/80">{route}</p>
              <p className="mt-2 text-[0.88rem] text-paper/65">{note}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
