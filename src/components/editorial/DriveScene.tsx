"use client";

import { useRef } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";

const SAND = "#EDE6D6";
const INK = "#0C1712";
const FOREST = "#1A2B23";
const DEEP = "#122019";
const PINEC = "#0E1A13";
const AMBER = "#C9A86A";

/* ------------------------------- pieces -------------------------------- */

function SpinningFace({ cx, spin }: { cx: number; spin: MotionValue<number> }) {
  const gRef = useRef<SVGGElement>(null);
  // Native SVG rotation about the hub point (cx, 0): guaranteed in-place
  // spin. CSS transform-origin on SVG groups anchors unpredictably, which
  // made the wheels orbit instead of rotate.
  useMotionValueEvent(spin, "change", (v) => {
    gRef.current?.setAttribute("transform", `rotate(${v} ${cx} 0)`);
  });
  return (
    <g ref={gRef}>
      <circle cx={cx} cy={0} r={14} fill={INK} stroke={SAND} strokeWidth={2} />
      <g stroke={SAND} strokeWidth={2.6}>
        <line x1={cx - 12.5} y1={0} x2={cx + 12.5} y2={0} />
        <line x1={cx - 6.2} y1={-10.8} x2={cx + 6.2} y2={10.8} />
        <line x1={cx - 6.2} y1={10.8} x2={cx + 6.2} y2={-10.8} />
      </g>
      <circle cx={cx} cy={0} r={4.5} fill={AMBER} />
    </g>
  );
}

function Wheel({ cx, spin }: { cx: number; spin?: MotionValue<number> }) {
  return (
    <g>
      <circle cx={cx} cy={0} r={24} fill={INK} />
      <circle cx={cx} cy={0} r={24} fill="none" stroke={SAND} strokeWidth={3} />
      {spin ? <SpinningFace cx={cx} spin={spin} /> : <SpinningFaceStatic cx={cx} />}
    </g>
  );
}

function SpinningFaceStatic({ cx }: { cx: number }) {
  return (
    <g>
      <circle cx={cx} cy={0} r={14} fill={INK} stroke={SAND} strokeWidth={2} />
      <g stroke={SAND} strokeWidth={2.6}>
        <line x1={cx - 12.5} y1={0} x2={cx + 12.5} y2={0} />
        <line x1={cx - 6.2} y1={-10.8} x2={cx + 6.2} y2={10.8} />
        <line x1={cx - 6.2} y1={10.8} x2={cx + 6.2} y2={-10.8} />
      </g>
      <circle cx={cx} cy={0} r={4.5} fill={AMBER} />
    </g>
  );
}

// Direction of travel: RIGHT. The car leads, the caravan trails behind it
// on the hitch — as a real outfit does.
function Convoy({ spin, bob }: { spin?: MotionValue<number>; bob?: MotionValue<number> }) {
  const body = (
    <g>
      {/* ---- caravan (trailing, left) ---- */}
      <rect x={8} y={-120} width={300} height={90} rx={9} fill={SAND} />
      <rect x={8} y={-60} width={300} height={30} fill={FOREST} />
      <rect x={8} y={-64} width={300} height={4} fill={AMBER} />
      {/* rear lamps (left face) */}
      <rect x={8} y={-52} width={5} height={12} fill={AMBER} />
      {/* windows */}
      <rect x={24} y={-106} width={44} height={30} fill={FOREST} />
      <rect x={76} y={-106} width={44} height={30} fill={FOREST} />
      <rect x={230} y={-106} width={30} height={30} fill={FOREST} />
      <line x1={46} y1={-106} x2={46} y2={-76} stroke={SAND} strokeWidth={2} />
      <line x1={98} y1={-106} x2={98} y2={-76} stroke={SAND} strokeWidth={2} />
      {/* door */}
      <rect x={136} y={-106} width={32} height={76} fill="none" stroke={FOREST} strokeWidth={2.5} />
      <rect x={141} y={-100} width={22} height={22} fill={FOREST} />
      <circle cx={162} cy={-62} r={2.5} fill={FOREST} />
      <rect x={143} y={-30} width={18} height={8} fill={FOREST} opacity={0.7} />
      {/* roof gear */}
      <rect x={60} y={-130} width={42} height={10} rx={2} fill={SAND} />
      <rect x={172} y={-128} width={52} height={8} rx={2} fill={SAND} opacity={0.9} />
      <line x1={8} y1={-120} x2={308} y2={-120} stroke={FOREST} strokeWidth={2} opacity={0.5} />
      {/* front locker face (right) */}
      <rect x={282} y={-72} width={26} height={42} rx={5} fill={SAND} stroke={FOREST} strokeWidth={2} />
      {/* marker lamps */}
      <circle cx={30} cy={-45} r={3} fill={AMBER} />
      <circle cx={180} cy={-45} r={3} fill={AMBER} />
      <circle cx={294} cy={-45} r={3} fill={AMBER} />
      {/* mudflaps */}
      <rect x={48} y={-24} width={10} height={16} fill={INK} />
      <rect x={208} y={-24} width={10} height={16} fill={INK} />
      {/* A-frame drawbar to the car */}
      <line x1={308} y1={-56} x2={346} y2={-44} stroke={SAND} strokeWidth={5} />
      <line x1={308} y1={-30} x2={346} y2={-44} stroke={SAND} strokeWidth={5} />
      <line x1={330} y1={-43} x2={330} y2={-28} stroke={SAND} strokeWidth={4} />
      <circle cx={330} cy={-24} r={5} fill={INK} stroke={SAND} strokeWidth={2} />

      {/* ---- tow car (leading, right) ---- */}
      <path
        d="M350,-26 L350,-60 Q350,-68 358,-68 L410,-68 L442,-104 Q445,-108 450,-108 L520,-108 Q526,-108 530,-102 L552,-68 L618,-68 Q626,-68 626,-60 L626,-26 Z"
        fill={SAND}
      />
      {/* glasshouse: windscreen slopes toward the front (right) */}
      <path d="M434,-100 L516,-100 L544,-70 L434,-70 Z" fill={FOREST} />
      <line x1={492} y1={-100} x2={500} y2={-70} stroke={SAND} strokeWidth={3} />
      <rect x={358} y={-98} width={56} height={26} fill={FOREST} />
      <line x1={386} y1={-98} x2={386} y2={-72} stroke={SAND} strokeWidth={2.5} />
      {/* waistline, doors, handles */}
      <rect x={350} y={-66} width={276} height={5} fill={FOREST} opacity={0.85} />
      <line x1={430} y1={-68} x2={430} y2={-30} stroke={FOREST} strokeWidth={2.5} opacity={0.6} />
      <line x1={520} y1={-68} x2={520} y2={-30} stroke={FOREST} strokeWidth={2.5} opacity={0.6} />
      <rect x={404} y={-58} width={14} height={4} rx={2} fill={FOREST} />
      <rect x={494} y={-58} width={14} height={4} rx={2} fill={FOREST} />
      {/* roof rails */}
      <rect x={448} y={-116} width={70} height={6} rx={3} fill={SAND} opacity={0.9} />
      {/* lamps: headlamp at the leading front, tail at the rear */}
      <rect x={618} y={-52} width={8} height={11} fill={AMBER} />
      <rect x={350} y={-52} width={6} height={11} fill={AMBER} opacity={0.85} />
      {/* exhaust */}
      <rect x={358} y={-24} width={16} height={5} fill={INK} />

      <Wheel cx={80} spin={spin} />
      <Wheel cx={240} spin={spin} />
      <Wheel cx={410} spin={spin} />
      <Wheel cx={560} spin={spin} />
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
    <g transform="translate(1180,432)">
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
      aria-label="Illustration: a tow car towing a caravan past hills, pines and a stone tower at dusk"
    >
      {/* stars */}
      {[
        [90, 46], [210, 96], [350, 40], [490, 76], [630, 34], [750, 86], [880, 40],
        [1030, 76], [1150, 330], [1270, 90], [1390, 250], [270, 140], [570, 130], [990, 150],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.7} fill={SAND} opacity={0.45} />
      ))}
      {/* sun, right of the headline */}
      <circle cx={1150} cy={170} r={60} fill="none" stroke={AMBER} strokeOpacity={0.35} strokeWidth={1.5} />
      <circle cx={1150} cy={170} r={44} fill={AMBER} />
      {/* birds */}
      <g stroke={SAND} strokeOpacity={0.6} strokeWidth={2.2} fill="none" strokeLinecap="round">
        <path d="M920,110 q10,-10 20,0 q10,-10 20,0" />
        <path d="M992,142 q8,-8 16,0 q8,-8 16,0" />
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

      {/* convoy: car leads right, caravan trails left */}
      <g transform="translate(403,545)">
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
