"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";

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
  const arch = (cx: number) => (
    <path d={`M${cx - 33},-4 A33,33 0 0 1 ${cx + 33},-4`} fill="none" stroke={SAND} strokeWidth={5} />
  );
  const body = (
    <g>
      {/* ---- caravan (trailing, left) ---- */}
      {/* status aerial */}
      <line x1={120} y1={-120} x2={120} y2={-144} stroke={SAND} strokeWidth={3} />
      <circle cx={120} cy={-146} r={3.5} fill={AMBER} />
      <rect x={8} y={-120} width={300} height={90} rx={10} fill={SAND} />
      <rect x={8} y={-60} width={300} height={30} fill={FOREST} />
      <rect x={8} y={-64} width={300} height={4} fill={AMBER} />
      {/* rear lamps (left face) */}
      <rect x={8} y={-52} width={5} height={12} fill={AMBER} />
      {/* windows: lit amber at dusk — someone's home, curtains drawn back */}
      <rect x={24} y={-106} width={44} height={30} rx={2} fill={AMBER} />
      <rect x={76} y={-106} width={44} height={30} rx={2} fill={AMBER} />
      <rect x={230} y={-106} width={30} height={30} rx={2} fill={AMBER} />
      <line x1={46} y1={-106} x2={46} y2={-76} stroke={FOREST} strokeWidth={2.5} />
      <line x1={98} y1={-106} x2={98} y2={-76} stroke={FOREST} strokeWidth={2.5} />
      <line x1={245} y1={-106} x2={245} y2={-76} stroke={FOREST} strokeWidth={2.5} />
      <rect x={24} y={-106} width={9} height={30} fill={SAND} opacity={0.9} />
      <rect x={59} y={-106} width={9} height={30} fill={SAND} opacity={0.9} />
      <rect x={76} y={-106} width={9} height={30} fill={SAND} opacity={0.9} />
      <rect x={111} y={-106} width={9} height={30} fill={SAND} opacity={0.9} />
      {/* side locker outline */}
      <rect x={196} y={-96} width={24} height={52} rx={2} fill="none" stroke={FOREST} strokeWidth={1.6} opacity={0.7} />
      {/* door + grab handle */}
      <rect x={136} y={-106} width={32} height={76} fill="none" stroke={FOREST} strokeWidth={2.5} />
      <rect x={141} y={-100} width={22} height={22} fill={AMBER} />
      <circle cx={162} cy={-62} r={2.5} fill={FOREST} />
      <line x1={172} y1={-96} x2={172} y2={-70} stroke={FOREST} strokeWidth={2.5} />
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
      {/* wheel arches + mudflaps */}
      {arch(80)}
      {arch(240)}
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
      {/* glasshouse: windscreen slopes toward the front (right), chrome-trimmed */}
      <path d="M434,-100 L516,-100 L544,-70 L434,-70 Z" fill={FOREST} stroke={SAND} strokeWidth={2} />
      <line x1={492} y1={-100} x2={500} y2={-70} stroke={SAND} strokeWidth={3} />
      <rect x={358} y={-98} width={56} height={26} fill={FOREST} stroke={SAND} strokeWidth={2} />
      <line x1={386} y1={-98} x2={386} y2={-72} stroke={SAND} strokeWidth={2.5} />
      {/* rear wiper on the tailgate glass */}
      <line x1={362} y1={-78} x2={376} y2={-92} stroke={SAND} strokeWidth={2.5} strokeLinecap="round" />
      {/* fuel flap */}
      <circle cx={560} cy={-44} r={5} fill="none" stroke={FOREST} strokeWidth={2} />
      {/* towing mirror, extended for the caravan's width */}
      <line x1={512} y1={-80} x2={528} y2={-80} stroke={SAND} strokeWidth={3.5} />
      <rect x={528} y={-88} width={12} height={14} rx={2} fill={SAND} stroke={FOREST} strokeWidth={1.5} />
      {/* waistline, doors, handles */}
      <rect x={350} y={-66} width={276} height={5} fill={FOREST} opacity={0.85} />
      <line x1={430} y1={-68} x2={430} y2={-30} stroke={FOREST} strokeWidth={2.5} opacity={0.6} />
      <line x1={520} y1={-68} x2={520} y2={-30} stroke={FOREST} strokeWidth={2.5} opacity={0.6} />
      <rect x={404} y={-58} width={14} height={4} rx={2} fill={FOREST} />
      <rect x={494} y={-58} width={14} height={4} rx={2} fill={FOREST} />
      {/* roof rails */}
      <rect x={448} y={-116} width={70} height={6} rx={3} fill={SAND} opacity={0.9} />
      {/* grille + bumper at the leading front, lamps both ends */}
      <rect x={614} y={-46} width={12} height={16} fill={FOREST} />
      <line x1={616} y1={-42} x2={624} y2={-42} stroke={SAND} strokeWidth={1.6} />
      <line x1={616} y1={-38} x2={624} y2={-38} stroke={SAND} strokeWidth={1.6} />
      <line x1={616} y1={-34} x2={624} y2={-34} stroke={SAND} strokeWidth={1.6} />
      <rect x={618} y={-56} width={8} height={9} fill={AMBER} />
      <rect x={350} y={-52} width={6} height={11} fill={AMBER} opacity={0.85} />
      <rect x={606} y={-30} width={20} height={6} fill={INK} />
      {/* tailgate trim */}
      <rect x={352} y={-40} width={30} height={10} fill={SAND} opacity={0.55} />
      {/* headlight beam on the road */}
      <polygon points="626,-50 800,-34 800,-6 626,-38" fill={AMBER} opacity={0.12} />
      {/* wheel-arch flares */}
      {arch(410)}
      {arch(560)}
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

// Village church on its hill — rubble-stone nave with traceried windows,
// gabled porch, staged west tower with pinnacled parapet, ribbed spire with
// lucarnes, churchyard yews, gravestones and a dry-stone wall. Unmistakably
// Cotswold; reads as a landmark, never a lighthouse.
function Yew({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-2.5} y={-18} width={5} height={18} fill={INK} />
      <circle cx={-15} cy={-20} r={14} fill={FOREST} />
      <circle cx={15} cy={-20} r={14} fill={FOREST} />
      <circle cx={0} cy={-32} r={20} fill={FOREST} />
      <circle cx={0} cy={-32} r={20} fill="none" stroke={INK} strokeWidth={2} opacity={0.6} />
    </g>
  );
}

function Tower() {
  return (
    <g transform="translate(1180,432)">
      <ellipse cx={0} cy={6} rx={190} ry={38} fill={PINEC} />
      {/* churchyard yews + gravestones (behind the wall) */}
      <Yew x={-168} y={-4} s={1.25} />
      <Yew x={152} y={0} s={1} />
      <g fill={SAND}>
        <rect x={-69} y={-16} width={10} height={16} />
        <circle cx={-64} cy={-16} r={5} />
        <rect x={-40} y={-20} width={4} height={20} />
        <rect x={-44} y={-16} width={12} height={4} />
        <rect x={77} y={-12} width={9} height={12} />
        <circle cx={81.5} cy={-12} r={4.5} />
      </g>
      {/* path from the west door to the wall gate */}
      <rect x={22} y={0} width={28} height={36} fill={SAND} opacity={0.28} />
      {/* nave */}
      <rect x={-128} y={-96} width={132} height={96} fill={SAND} />
      {/* stone courses */}
      {Array.from({ length: 7 }).map((_, i) => (
        <line key={i} x1={-128} y1={-88 + i * 12} x2={4} y2={-88 + i * 12} stroke={FOREST} strokeWidth={1.5} opacity={0.18} />
      ))}
      {/* quoins, left corner */}
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x={-128} y={-96 + i * 16} width={i % 2 ? 10 : 7} height={9} fill={SAND} stroke={FOREST} strokeWidth={1.2} />
      ))}
      {/* plinth */}
      <rect x={-128} y={-14} width={132} height={14} fill={FOREST} opacity={0.55} />
      {/* roof with lead seams + coped gable + cross finial */}
      <polygon points="-136,-96 4,-96 -66,-148" fill={DEEP} />
      {[-110, -88, -44, -22].map((x) => (
        <line key={x} x1={-66} y1={-146} x2={x} y2={-97} stroke={SAND} strokeWidth={1.2} opacity={0.4} />
      ))}
      <polygon points="-136,-96 4,-96 -66,-148" fill="none" stroke={SAND} strokeWidth={3} />
      <line x1={-66} y1={-148} x2={-66} y2={-160} stroke={SAND} strokeWidth={3} />
      <line x1={-72} y1={-156} x2={-60} y2={-156} stroke={SAND} strokeWidth={3} />
      {/* glowing nave windows: pointed heads, stone mullions, sills */}
      {[-102, -70, -38].map((x) => (
        <g key={x}>
          <path
            d={`M${x},-32 L${x},-62 Q${x},-74 ${x + 8},-78 Q${x + 16},-74 ${x + 16},-62 L${x + 16},-32 Z`}
            fill={AMBER}
            stroke={FOREST}
            strokeWidth={2}
          />
          <line x1={x + 8} y1={-70} x2={x + 8} y2={-32} stroke={FOREST} strokeWidth={2} />
          <line x1={x} y1={-48} x2={x + 16} y2={-48} stroke={FOREST} strokeWidth={2} />
          <rect x={x - 2} y={-32} width={20} height={4} fill={SAND} stroke={FOREST} strokeWidth={1} />
        </g>
      ))}
      {/* porch: gabled, pointed arch, niche cross */}
      <rect x={-150} y={-52} width={26} height={52} fill={SAND} />
      <polygon points="-153,-52 -121,-52 -137,-66" fill={DEEP} />
      <polygon points="-153,-52 -121,-52 -137,-66" fill="none" stroke={SAND} strokeWidth={2} />
      <path d="M-143,0 L-143,-30 Q-143,-40 -137,-40 Q-131,-40 -131,-30 L-131,0 Z" fill={FOREST} />
      <path d="M-141,-46 L-141,-56 M-143.5,-50 L-138.5,-50" stroke={FOREST} strokeWidth={1.8} />
      {/* west tower */}
      <rect x={4} y={-196} width={64} height={196} fill={SAND} />
      {/* staged string courses */}
      <rect x={4} y={-140} width={64} height={4} fill={FOREST} opacity={0.55} />
      <rect x={4} y={-70} width={64} height={4} fill={FOREST} opacity={0.4} />
      {/* tower quoins, both corners */}
      {Array.from({ length: 12 }).map((_, i) => (
        <g key={i}>
          <rect x={4} y={-196 + i * 16} width={i % 2 ? 10 : 7} height={9} fill={SAND} stroke={FOREST} strokeWidth={1.2} />
          <rect x={68 - (i % 2 ? 10 : 7)} y={-196 + i * 16} width={i % 2 ? 10 : 7} height={9} fill={SAND} stroke={FOREST} strokeWidth={1.2} />
        </g>
      ))}
      {/* stepped diagonal buttresses at the tower feet */}
      <g fill={SAND} stroke={FOREST} strokeWidth={1.5}>
        <rect x={0} y={-70} width={12} height={70} />
        <rect x={2} y={-130} width={8} height={62} />
        <polygon points="2,-130 10,-130 6,-140" />
        <rect x={60} y={-70} width={12} height={70} />
        <rect x={62} y={-130} width={8} height={62} />
        <polygon points="62,-130 70,-130 66,-140" />
      </g>
      {/* west window: tall, glowing, traceried */}
      <path
        d="M24,-56 L24,-92 Q24,-104 36,-108 Q48,-104 48,-92 L48,-56 Z"
        fill={AMBER}
        stroke={FOREST}
        strokeWidth={2.5}
      />
      <line x1={36} y1={-100} x2={36} y2={-56} stroke={FOREST} strokeWidth={2} />
      <line x1={24} y1={-72} x2={48} y2={-72} stroke={FOREST} strokeWidth={2} />
      <rect x={22} y={-56} width={28} height={4} fill={SAND} stroke={FOREST} strokeWidth={1} />
      {/* clock with quarter ticks */}
      <circle cx={36} cy={-118} r={12} fill="#F8F7F2" />
      <line x1={36} y1={-128} x2={36} y2={-124} stroke={FOREST} strokeWidth={2} />
      <line x1={36} y1={-112} x2={36} y2={-108} stroke={FOREST} strokeWidth={2} />
      <line x1={26} y1={-118} x2={30} y2={-118} stroke={FOREST} strokeWidth={2} />
      <line x1={42} y1={-118} x2={46} y2={-118} stroke={FOREST} strokeWidth={2} />
      <line x1={36} y1={-118} x2={36} y2={-126} stroke={FOREST} strokeWidth={2.4} />
      <line x1={36} y1={-118} x2={42} y2={-115} stroke={FOREST} strokeWidth={2.4} />
      {/* belfry: paired pointed lights with louvers */}
      {[16, 42].map((x) => (
        <g key={x}>
          <path
            d={`M${x},-154 L${x},-174 Q${x},-184 ${x + 7},-190 Q${x + 14},-184 ${x + 14},-174 L${x + 14},-154 Z`}
            fill={AMBER}
            stroke={FOREST}
            strokeWidth={2}
          />
          {[-170, -164, -158].map((y) => (
            <line key={y} x1={x + 2} y1={y} x2={x + 12} y2={y} stroke={FOREST} strokeWidth={2.2} />
          ))}
          <rect x={x - 2} y={-154} width={18} height={4} fill={SAND} stroke={FOREST} strokeWidth={1} />
        </g>
      ))}
      {/* spire with ribs + lucarnes */}
      <polygon points="4,-196 68,-196 36,-272" fill={DEEP} stroke={SAND} strokeWidth={2.5} />
      <line x1={36} y1={-196} x2={36} y2={-270} stroke={SAND} strokeWidth={1.5} opacity={0.5} />
      <line x1={20} y1={-196} x2={36} y2={-270} stroke={SAND} strokeWidth={1.2} opacity={0.4} />
      <line x1={52} y1={-196} x2={36} y2={-270} stroke={SAND} strokeWidth={1.2} opacity={0.4} />
      {[
        { x: 22, apex: 27 },
        { x: 42, apex: 47 },
      ].map(({ x, apex }) => (
        <g key={x}>
          <rect x={x} y={-240} width={10} height={12} fill={DEEP} stroke={SAND} strokeWidth={1.5} />
          <polygon points={`${x},-240 ${x + 10},-240 ${apex},-248`} fill={SAND} />
          <rect x={x + 3.5} y={-237} width={3} height={8} fill={AMBER} />
        </g>
      ))}
      {/* weathercock: rod, orb, wind arrow */}
      <line x1={36} y1={-272} x2={36} y2={-290} stroke={SAND} strokeWidth={3} />
      <line x1={28} y1={-284} x2={46} y2={-284} stroke={SAND} strokeWidth={2} />
      <polygon points="46,-288 46,-280 51,-284" fill={SAND} />
      <circle cx={36} cy={-290} r={3} fill={AMBER} />
      {/* parapet with merlons + corner pinnacles (front face) */}
      <rect x={2} y={-202} width={68} height={7} fill={SAND} stroke={FOREST} strokeWidth={1.5} />
      {[4, 20, 36, 52].map((x) => (
        <rect key={x} x={x} y={-212} width={10} height={10} fill={SAND} stroke={FOREST} strokeWidth={1.5} />
      ))}
      {[2, 61].map((x) => (
        <g key={x}>
          <rect x={x} y={-226} width={9} height={22} fill={SAND} stroke={FOREST} strokeWidth={1.5} />
          <polygon points={`${x},-226 ${x + 9},-226 ${x + 4.5},-238`} fill={SAND} stroke={FOREST} strokeWidth={1.5} />
          <circle cx={x + 4.5} cy={-240} r={2} fill={AMBER} />
        </g>
      ))}
      {/* planked west door with strap hinges */}
      <path d="M26,0 L26,-38 Q26,-50 36,-54 Q46,-50 46,-38 L46,0 Z" fill={FOREST} />
      {[31, 36, 41].map((x) => (
        <line key={x} x1={x} y1={-44} x2={x} y2={0} stroke={INK} strokeWidth={1.2} opacity={0.7} />
      ))}
      <line x1={26} y1={-14} x2={46} y2={-14} stroke={INK} strokeWidth={2} opacity={0.7} />
      <line x1={26} y1={-32} x2={46} y2={-32} stroke={INK} strokeWidth={2} opacity={0.7} />
      {/* dry-stone wall with gate + coping (foreground) */}
      {[
        { x: -190, w: 212 },
        { x: 50, w: 140 },
      ].map(({ x, w }) => (
        <g key={x}>
          <rect x={x} y={8} width={w} height={14} fill={DEEP} />
          <rect x={x} y={5} width={w} height={4} fill={SAND} opacity={0.75} />
        </g>
      ))}
      {[-168, -146, -124, -102, -80, -58, -36, -14, 72, 94, 116, 138, 160].map((x) => (
        <line key={x} x1={x} y1={9} x2={x} y2={22} stroke={FOREST} strokeWidth={1.5} opacity={0.7} />
      ))}
      {/* sheep grazing the foreground */}
      <Sheep x={-72} y={20} s={1} />
      <Sheep x={96} y={24} s={0.8} />
    </g>
  );
}

function Sheep({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <ellipse cx={0} cy={0} rx={14} ry={9} fill={SAND} />
      <circle cx={13} cy={-4} r={4.5} fill={FOREST} />
      <line x1={-7} y1={8} x2={-7} y2={15} stroke={FOREST} strokeWidth={2.5} />
      <line x1={7} y1={8} x2={7} y2={15} stroke={FOREST} strokeWidth={2.5} />
    </g>
  );
}

/* -------------------------------- scene --------------------------------- */

const POLES = [-160, 160, 480, 800, 1120, 1440];

export function DriveScene({ progress }: { progress?: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  // Section progress when pinned inside the hero, else page scroll. All
  // motion below derives from this single value.
  const fallback = useTransform(scrollY, [0, 800], [0, 1]);
  const p = progress ?? fallback;
  const far = useTransform(p, [0, 1], [0, -60]);
  const mid = useTransform(p, [0, 1], [0, -150]);
  const towerX = useTransform(p, [0, 1], [0, -240]);
  const fast = useTransform(p, [0, 1], [0, -440]);
  const spin = useTransform(p, [0, 1], [0, 1060]); // scaled to the longer run
  const bob = useTransform(p, [0, 0.25, 0.5, 0.75, 1], [0, -6, 0, -6, 0]);
  // The outfit starts nosed in from off-screen left and drives across as
  // you scroll — parked at the edge, not hidden. It crosses centre (~p 0.44),
  // wipes over the hidden line, and pulls away right.
  const X_START = -300;
  const X_END = 1290;
  const convoyXAnim = useTransform(p, [0, 1], [X_START, X_END]);
  const convoyX: number | MotionValue<number> = reduce ? X_END : convoyXAnim;
  // Cinematic centre wipe: the outfit's midpoint reaches screen centre at
  // ~p 0.44. The line's opacity is driven by the van's measured nose
  // position against the text's MEASURED half-width (not guessed scroll
  // stops): it fades in over the last 60px of approach and hits 1 exactly
  // as the nose covers the final letter — so the visible reveal is purely
  // physical as the rear bumper clears left→right, then the line stays for
  // the rest of the pin. Re-measured after fonts load so Cormorant's real
  // advances are used, not estimates.
  const halfRef = useRef(270); // fallback estimate until measured
  const textRef = useRef<SVGTextElement>(null);
  const phraseOpacity = useMotionValue(reduce ? 1 : 0);
  useEffect(() => {
    const measure = () => {
      const el = textRef.current;
      if (el) {
        try {
          halfRef.current = el.getComputedTextLength() / 2;
        } catch {
          /* keep estimate */
        }
      }
    };
    measure();
    if (typeof document !== "undefined" && document.fonts?.ready) {
      void document.fonts.ready.then(measure).catch(() => {});
    }
  }, []);
  useMotionValueEvent(p, "change", (v) => {
    if (reduce) {
      phraseOpacity.set(1);
      return;
    }
    const nose = X_START + v * (X_END - X_START) + 626; // van front edge in scene units
    const lastLetter = 720 + halfRef.current;
    phraseOpacity.set(Math.min(1, Math.max(0, (nose - (lastLetter - 60)) / 60)));
  });

  return (
    <svg
      viewBox="0 0 1440 640"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-0 h-full w-full"
      role="img"
      aria-label="Illustration: a tow car towing a caravan past hills, pines and a village church at dusk"
    >
      {/* stars */}
      {[
        [90, 46], [210, 96], [350, 40], [490, 76], [630, 34], [750, 86], [880, 40],
        [1030, 76], [1080, 250], [1270, 90], [1390, 250], [270, 140], [570, 130], [880, 220],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.7} fill={SAND} opacity={0.45} />
      ))}
      {/* dusk band lifting the horizon */}
      <rect x={0} y={330} width={1440} height={142} fill="#212B22" />
      {/* sun, low beside the church tower — the outfit tows toward it.
          Large flat amber disc with halo rings + rays for dusk legibility. */}
      <circle cx={960} cy={165} r={104} fill="none" stroke={AMBER} strokeOpacity={0.18} strokeWidth={1.5} />
      <circle cx={960} cy={165} r={78} fill="none" stroke={AMBER} strokeOpacity={0.35} strokeWidth={1.5} />
      <g stroke={AMBER} strokeOpacity={0.7} strokeWidth={3} strokeLinecap="round">
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6;
          const x1 = 960 + Math.cos(a) * 72;
          const y1 = 165 + Math.sin(a) * 72;
          const x2 = 960 + Math.cos(a) * 88;
          const y2 = 165 + Math.sin(a) * 88;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
      <circle cx={960} cy={165} r={58} fill={AMBER} />
      <circle cx={960} cy={165} r={58} fill="none" stroke={SAND} strokeOpacity={0.5} strokeWidth={2} />
      {/* birds heading home, same direction as the outfit */}
      <g stroke={SAND} strokeOpacity={0.6} strokeWidth={2.2} fill="none" strokeLinecap="round">
        <path d="M1085,115 q10,-10 20,0 q10,-10 20,0" />
        <path d="M1150,148 q8,-8 16,0 q8,-8 16,0" />
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
        {/* two birds riding the wire */}
        <g stroke={SAND} strokeWidth={2} fill="none" strokeLinecap="round">
          <path d="M594,310 q3.5,-7 7,0 q3.5,-7 7,0" />
          <path d="M636,313 q3,-6 6,0 q3,-6 6,0" />
        </g>
        {/* the depot gate: where every hire begins */}
        <g>
          <rect x={36} y={336} width={13} height={136} fill={INK} />
          <rect x={171} y={336} width={13} height={136} fill={INK} />
          <rect x={24} y={326} width={172} height={12} fill={INK} />
          <rect x={58} y={342} width={104} height={38} fill={SAND} />
          <text x={110} y={357} textAnchor="middle" fontSize={13} fontWeight={800} fontFamily="Manrope, sans-serif" fill={FOREST} letterSpacing={1.5}>
            LANSDOWN
          </text>
          <text x={110} y={371} textAnchor="middle" fontSize={9.5} fontWeight={700} fontFamily="Manrope, sans-serif" fill={FOREST} letterSpacing={2}>
            DEPOT · TOW OUT
          </text>
        </g>
      </motion.g>

      {/* road */}
      <rect x={0} y={472} width={1440} height={96} fill={INK} />
      <line x1={0} y1={472} x2={1440} y2={472} stroke={SAND} strokeOpacity={0.85} strokeWidth={3} />
      <line x1={0} y1={522} x2={1440} y2={522} stroke={SAND} strokeOpacity={0.8} strokeWidth={3} strokeDasharray="34 26" />

      {/* the hidden line: centred title card, tracked-out uppercase Cormorant.
          TRUE OCCLUSION WIPE — painted BEFORE the convoy (behind it) and its
          opacity is driven by the van's measured nose position (see above),
          so at whatever width Cormorant meters, the fade completes exactly
          as the van covers the last letter. Keep this line narrower than the
          ~618-wide van body or full coverage is impossible. */}
      <motion.text
        ref={textRef}
        x={720}
        y={505}
        textAnchor="middle"
        fontSize={31}
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontWeight={500}
        letterSpacing={5}
        fill="#FFFFFF"
        stroke="#0C1712"
        strokeWidth={0.6}
        paintOrder="stroke"
        style={{ opacity: phraseOpacity }}
      >
        TOW OUT AT GOLDEN HOUR
      </motion.text>

      {/* convoy: car leads right, caravan trails left */}
      <motion.g style={{ x: convoyX, y: 545 }}>
        {reduce ? <Convoy /> : <Convoy spin={spin} bob={bob} />}
      </motion.g>

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
