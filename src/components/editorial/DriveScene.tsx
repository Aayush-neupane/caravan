"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";

const SAND = "#EDE6D6";
const INK = "#0C1712";
const FOREST = "#1A2B23";
const DEEP = "#122019";
const PINEC = "#0E1A13";
const AMBER = "#C9A86A";

/* ------------------------------- pieces -------------------------------- */

function Wheel({ cx, spin }: { cx: number; spin?: MotionValue<number> }) {
  const spokes = (
    <g stroke={SAND} strokeWidth={2.4}>
      <line x1={cx - 12} y1={0} x2={cx + 12} y2={0} />
      <line x1={cx - 6} y1={-10.4} x2={cx + 6} y2={10.4} />
      <line x1={cx - 6} y1={10.4} x2={cx + 6} y2={-10.4} />
    </g>
  );
  return (
    <g>
      <circle cx={cx} cy={0} r={24} fill={INK} stroke={SAND} strokeWidth={3} />
      {spin ? (
        <motion.g style={{ rotate: spin, transformBox: "fill-box", transformOrigin: "center" }}>
          <circle cx={cx} cy={0} r={13} fill="none" stroke={SAND} strokeWidth={2.5} />
          {spokes}
          <circle cx={cx} cy={0} r={4} fill={AMBER} />
        </motion.g>
      ) : (
        <g>
          <circle cx={cx} cy={0} r={13} fill="none" stroke={SAND} strokeWidth={2.5} />
          {spokes}
          <circle cx={cx} cy={0} r={4} fill={AMBER} />
        </g>
      )}
    </g>
  );
}

function Convoy({ spin, bob }: { spin?: MotionValue<number>; bob?: MotionValue<number> }) {
  const body = (
    <g>
      {/* tow car */}
      <path
        d="M4,-26 L4,-62 Q4,-70 12,-70 L62,-70 L94,-106 Q97,-110 102,-110 L172,-110 Q178,-110 182,-104 L202,-70 L272,-70 Q280,-70 280,-62 L280,-26 Z"
        fill={SAND}
      />
      <path d="M98,-102 L170,-102 L184,-74 L72,-74 Z" fill={FOREST} />
      <line x1={128} y1={-102} x2={128} y2={-74} stroke={SAND} strokeWidth={3} />
      <rect x={64} y={-66} width={120} height={5} fill={FOREST} opacity={0.85} />
      <line x1={30} y1={-70} x2={30} y2={-30} stroke={FOREST} strokeWidth={2.5} opacity={0.6} />
      <line x1={248} y1={-70} x2={248} y2={-30} stroke={FOREST} strokeWidth={2.5} opacity={0.6} />
      <rect x={272} y={-52} width={8} height={10} fill={AMBER} />
      <rect x={96} y={-118} width={70} height={6} rx={3} fill={SAND} opacity={0.9} />
      {/* hitch */}
      <line x1={280} y1={-42} x2={312} y2={-42} stroke={SAND} strokeWidth={6} />
      <line x1={302} y1={-42} x2={302} y2={-28} stroke={SAND} strokeWidth={4} />
      <circle cx={302} cy={-24} r={5} fill={INK} stroke={SAND} strokeWidth={2} />
      {/* caravan */}
      <rect x={312} y={-120} width={298} height={90} rx={9} fill={SAND} />
      <rect x={312} y={-60} width={298} height={30} fill={FOREST} />
      <rect x={312} y={-64} width={298} height={4} fill={AMBER} />
      <rect x={326} y={-106} width={44} height={30} fill={FOREST} />
      <rect x={378} y={-106} width={44} height={30} fill={FOREST} />
      <rect x={516} y={-106} width={30} height={30} fill={FOREST} />
      <line x1={348} y1={-106} x2={348} y2={-76} stroke={SAND} strokeWidth={2} />
      <line x1={400} y1={-106} x2={400} y2={-76} stroke={SAND} strokeWidth={2} />
      {/* door */}
      <rect x={436} y={-106} width={30} height={76} fill="none" stroke={FOREST} strokeWidth={2.5} />
      <rect x={441} y={-100} width={20} height={22} fill={FOREST} />
      <circle cx={459} cy={-62} r={2.5} fill={FOREST} />
      <rect x={444} y={-30} width={16} height={8} fill={FOREST} opacity={0.7} />
      {/* roof gear */}
      <rect x={360} y={-130} width={42} height={10} rx={2} fill={SAND} />
      <rect x={472} y={-128} width={52} height={8} rx={2} fill={SAND} opacity={0.9} />
      <line x1={312} y1={-120} x2={610} y2={-120} stroke={FOREST} strokeWidth={2} opacity={0.5} />
      {/* marker lamps + plate */}
      <circle cx={330} cy={-45} r={3} fill={AMBER} />
      <circle cx={480} cy={-45} r={3} fill={AMBER} />
      <circle cx={594} cy={-45} r={3} fill={AMBER} />
      <rect x={584} y={-72} width={26} height={34} rx={5} fill={SAND} stroke={FOREST} strokeWidth={2} />
      {/* mudflaps */}
      <rect x={336} y={-24} width={10} height={16} fill={INK} />
      <rect x={566} y={-24} width={10} height={16} fill={INK} />
      <Wheel cx={70} spin={spin} />
      <Wheel cx={212} spin={spin} />
      <Wheel cx={372} spin={spin} />
      <Wheel cx={542} spin={spin} />
    </g>
  );
  if (!bob) return <g>{body}</g>;
  return <motion.g style={{ y: bob }}>{body}</motion.g>;
}

function Pine({ x, y, s, tone }: { x: number; y: number; s: number; tone: string }) {
  const w = 26 * s;
  const h = 62 * s;
  return (
    <g fill={tone}>
      <rect x={x - 2.5 * s} y={y - 12 * s} width={5 * s} height={12 * s} />
      <path d={`M${x},${y - 8 * s - h} L${x - w / 2},${y - 8 * s} L${x + w / 2},${y - 8 * s} Z`} />
      <path d={`M${x},${y - 8 * s - h - 22 * s} L${x - w / 3.4},${y - 8 * s - 20 * s} L${x + w / 3.4},${y - 8 * s - 20 * s} Z`} />
    </g>
  );
}

function Tower() {
  return (
    <g transform="translate(1050,432)">
      <ellipse cx={0} cy={6} rx={168} ry={38} fill={PINEC} />
      <Pine x={-120} y={0} s={1.5} tone={PINEC} />
      <Pine x={-88} y={4} s={1.1} tone={DEEP} />
      <Pine x={120} y={0} s={1.5} tone={PINEC} />
      <Pine x={90} y={4} s={1.1} tone={DEEP} />
      <path d="M-40,0 L-32,-252 L32,-252 L40,0 Z" fill={SAND} />
      <line x1={-36} y1={-82} x2={36} y2={-82} stroke={FOREST} strokeWidth={3} opacity={0.45} />
      <line x1={-34} y1={-162} x2={34} y2={-162} stroke={FOREST} strokeWidth={3} opacity={0.45} />
      {[ -30, -12, 6, 24 ].map((x) => (
        <rect key={x} x={x} y={-268} width={11} height={16} fill={SAND} />
      ))}
      <rect x={-22} y={-228} width={15} height={52} rx={7.5} fill={FOREST} />
      <rect x={-34} y={-142} width={12} height={38} rx={6} fill={FOREST} />
      <rect x={22} y={-142} width={12} height={38} rx={6} fill={FOREST} />
      <path d="M-13,0 L-13,-44 Q-13,-54 0,-54 Q13,-54 13,-44 L13,0 Z" fill={FOREST} />
      <line x1={0} y1={-268} x2={0} y2={-300} stroke={SAND} strokeWidth={3.5} />
      <polygon points="0,-300 34,-291 0,-282" fill={AMBER} />
    </g>
  );
}

/* -------------------------------- scene --------------------------------- */

const POLES = [-160, 160, 480, 800, 1120, 1440];

export function DriveScene() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const far = useTransform(scrollY, [0, 800], [0, -60]);
  const mid = useTransform(scrollY, [0, 800], [0, -150]);
  const towerX = useTransform(scrollY, [0, 800], [0, -240]);
  const fast = useTransform(scrollY, [0, 800], [0, -440]);
  const spin = useTransform(scrollY, [0, 800], [0, 900]);
  const bob = useTransform(scrollY, [0, 200, 400, 600, 800], [0, -6, 0, -6, 0]);

  return (
    <svg
      viewBox="0 0 1440 640"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-0 h-full w-full"
      role="img"
      aria-label="Illustration: a caravan driving past hills, pines and a stone tower at dusk"
    >
      {/* stars */}
      {[
        [90, 46], [210, 96], [350, 40], [490, 76], [630, 34], [750, 86], [880, 40],
        [1030, 76], [1150, 36], [1270, 90], [1390, 50], [270, 140], [570, 130], [990, 150],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.7} fill={SAND} opacity={0.45} />
      ))}
      {/* sun */}
      <circle cx={230} cy={200} r={60} fill="none" stroke={AMBER} strokeOpacity={0.35} strokeWidth={1.5} />
      <circle cx={230} cy={200} r={44} fill={AMBER} />
      {/* birds */}
      <g stroke={SAND} strokeOpacity={0.6} strokeWidth={2.2} fill="none" strokeLinecap="round">
        <path d="M1180,120 q10,-10 20,0 q10,-10 20,0" />
        <path d="M1252,152 q8,-8 16,0 q8,-8 16,0" />
      </g>

      {/* far mountains + snowcaps */}
      <motion.g style={reduce ? undefined : { x: far }}>
        <path
          d="M-160,452 L120,272 L220,352 L420,198 L530,312 L710,222 L830,332 L1010,242 L1130,342 L1310,252 L1600,352 L1600,660 L-160,660 Z"
          fill={DEEP}
        />
        {[
          "M398,222 L420,198 L442,222 L430,232 L410,232 Z",
          "M688,246 L710,222 L732,246 L720,256 L700,256 Z",
          "M988,266 L1010,242 L1032,266 L1020,276 L1000,276 Z",
          "M1288,276 L1310,252 L1332,276 L1320,286 L1300,286 Z",
        ].map((d) => (
          <path key={d} d={d} fill={SAND} opacity={0.92} />
        ))}
      </motion.g>

      {/* pine ridge */}
      <motion.g style={reduce ? undefined : { x: mid }}>
        <path d="M-160,520 C200,440 500,500 800,460 C1050,428 1300,470 1600,440 L1600,660 L-160,660 Z" fill={PINEC} />
        {[
          [40, 500, 1.4], [140, 492, 1.0], [260, 496, 1.6], [380, 488, 1.1], [500, 494, 1.5],
          [640, 486, 1.0], [780, 492, 1.4], [920, 488, 1.1], [1180, 490, 1.4], [1300, 486, 1.1], [1420, 492, 1.5],
        ].map(([x, y, s], i) => (
          <Pine key={i} x={x as number} y={y as number} s={s as number} tone={i % 2 ? DEEP : PINEC} />
        ))}
      </motion.g>

      {/* tower hill */}
      <motion.g style={reduce ? undefined : { x: towerX }}>
        <Tower />
      </motion.g>

      {/* telegraph poles + wire (fastest sky layer) */}
      <motion.g style={reduce ? undefined : { x: fast }}>
        <path
          d="M-480,318 Q-320,352 -160,318 Q0,352 160,318 Q320,352 480,318 Q640,352 800,318 Q960,352 1120,318 Q1280,352 1440,318 Q1600,352 1760,318"
          fill="none"
          stroke={INK}
          strokeWidth={3}
        />
        {POLES.map((x) => (
          <g key={x}>
            <rect x={x} y={288} width={11} height={184} fill={INK} />
            <rect x={x - 30} y={308} width={71} height={9} fill={INK} />
          </g>
        ))}
      </motion.g>

      {/* road */}
      <rect x={0} y={472} width={1440} height={96} fill={INK} />
      <line x1={0} y1={472} x2={1440} y2={472} stroke={SAND} strokeOpacity={0.85} strokeWidth={3} />
      <line x1={0} y1={522} x2={1440} y2={522} stroke={SAND} strokeOpacity={0.8} strokeWidth={3} strokeDasharray="34 26" />

      {/* convoy */}
      <g transform="translate(415,545)">
        {reduce ? <Convoy /> : <Convoy spin={spin} bob={bob} />}
      </g>

      {/* foreground grass */}
      <motion.g style={reduce ? undefined : { x: fast }}>
        <rect x={-480} y={600} width={2400} height={40} fill="#0A1410" />
        <g stroke={SAND} strokeOpacity={0.3} strokeWidth={2.5} strokeLinecap="round">
          {[-400, -260, -120, 20, 160, 300, 440, 580, 720, 860, 1000, 1140, 1280, 1420, 1560, 1700].map((x) => (
            <path key={x} d={`M${x},628 l0,-14 M${x + 12},628 l-5,-11`} />
          ))}
        </g>
      </motion.g>
    </svg>
  );
}
