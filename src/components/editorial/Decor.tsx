"use client";

import { useId } from "react";

/* Expedition-log decor: contour maps, stamps, route dividers.
   All motifs belong to overland travel (maps, permits, mile markers).
   No gradients, no glow, no glass — ink on paper. */

// Faint topographic contours, absolutely positioned.
export function TopoLines({ dark = false, variant = 0, className = "" }: { dark?: boolean; variant?: number; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const stroke = dark ? "#EDE6D6" : "#1A2B23";
  const paths = [
    "M-40,120 C120,60 260,180 460,110 C660,40 820,150 1060,90 C1240,45 1380,120 1520,80",
    "M-40,200 C140,140 300,260 500,190 C700,120 860,230 1100,170 C1280,125 1420,200 1520,160",
    "M-40,280 C160,220 340,340 540,270 C740,200 900,310 1140,250 C1320,205 1440,280 1520,240",
    "M-40,360 C180,300 380,420 580,350 C780,280 940,390 1180,330 C1360,285 1460,360 1520,320",
    "M-40,40 C200,-20 380,80 600,20 C820,-40 980,60 1220,10 C1380,-25 1470,40 1520,20",
  ];
  const offset = (variant * 37) % 60;
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 60 1480 340"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {paths.map((d, i) => (
        <path
          key={`${uid}-${i}`}
          d={d}
          transform={`translate(0, ${offset * (i % 2 ? 1 : -1) * 0.4})`}
          fill="none"
          stroke={stroke}
          strokeOpacity={i === 2 ? 0.22 : 0.12}
          strokeWidth={i === 2 ? 1.4 : 1}
          strokeDasharray={i === 2 ? "none" : "7 6"}
        />
      ))}
      {/* trig points */}
      {[
        [300 + offset, 150],
        [760 - offset, 230],
        [1180 + offset, 120],
      ].map(([x, y], i) => (
        <g key={`${uid}-t${i}`} stroke={stroke} strokeOpacity={0.3} strokeWidth={1}>
          <circle cx={x} cy={y} r={7} fill="none" />
          <circle cx={x} cy={y} r={1.4} fill={stroke} />
          <text x={x + 11} y={y + 4} fontSize={13} fill={stroke} fillOpacity={0.55} fontFamily="Manrope, sans-serif" fontWeight={700}>
            {120 + i * 37 + offset}m
          </text>
        </g>
      ))}
    </svg>
  );
}

// Rotating expedition stamp. Static when reduced motion is preferred.
export function Stamp({ text = "SLOW TRAVEL • MELB • EST 2026 • ", size = 112, dark = false }: { text?: string; size?: number; dark?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const ink = dark ? "#EDE6D6" : "#1A2B23";
  return (
    <div className="stamp-spin relative shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <defs>
          <path id={`circ-${uid}`} d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
        </defs>
        <circle cx={60} cy={60} r={57} fill="none" stroke={ink} strokeWidth={1.6} />
        <circle cx={60} cy={60} r={31} fill="none" stroke={ink} strokeWidth={1.2} />
        <text fontSize={11.5} letterSpacing={2.5} fill={ink} fontFamily="Manrope, sans-serif" fontWeight={800}>
          <textPath href={`#circ-${uid}`}>{text}</textPath>
        </text>
        {/* compass needle */}
        <g stroke={ink} strokeWidth={2} strokeLinecap="round">
          <line x1={60} y1={44} x2={60} y2={76} />
          <line x1={44} y1={60} x2={76} y2={60} opacity={0.45} />
        </g>
        <polygon points="60,40 64,52 60,49 56,52" fill="#C9A86A" />
      </svg>
    </div>
  );
}

// Expedition section marker: oversized numeral, rule, coordinates.
export function SectionMarker({
  index,
  kicker,
  coords,
  dark = false,
}: {
  index: string;
  kicker: string;
  coords?: string;
  dark?: boolean;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b-2 border-current pb-3" style={{ color: dark ? "#EDE6D6" : "#1A2B23" }}>
      <div className="flex items-baseline gap-4">
        <span className="font-display text-6xl leading-none sm:text-7xl" style={{ color: "transparent", WebkitTextStroke: `1.5px ${dark ? "#C9A86A" : "#1A2B23"}` }} aria-hidden="true">
          {index}
        </span>
        <p className="tick-accent" style={{ color: dark ? "#C9A86A" : undefined }}>{kicker}</p>
      </div>
      {coords ? (
        <p className="hidden font-mono text-[0.72rem] tracking-wider opacity-60 sm:block">{coords}</p>
      ) : null}
    </div>
  );
}

// Small compass for headers/footers.
export function Compass({ size = 30, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx={16} cy={16} r={14.5} fill="none" stroke="currentColor" strokeWidth={1.4} />
      <polygon points="16,5 19,16 16,27 13,16" fill="currentColor" />
      <polygon points="16,5 19,16 13,16" fill="#C9A86A" />
      <text x={16} y={11.5} textAnchor="middle" fontSize={7} fontWeight={800} fontFamily="Manrope, sans-serif" fill="#1A2B23">N</text>
    </svg>
  );
}

// Viewfinder-framed photograph: duotone ink that lifts on hover,
// rangefinder corner ticks, and a mono data strip. The analogue
// camera metaphor, applied to expedition photography.
export function Framed({
  src,
  alt,
  caption,
  meta = "35MM · F/8",
  ratio = "aspect-[16/10]",
  eager = false,
  radius = 6,
}: {
  src: string;
  alt: string;
  caption: string;
  meta?: string;
  ratio?: string;
  eager?: boolean;
  radius?: number;
}) {
  return (
    <figure className="tone-img group overflow-hidden bg-forest" style={{ borderRadius: radius }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={1600}
        height={1000}
        loading={eager ? "eager" : "lazy"}
        className={`${ratio} w-full object-cover transition-transform duration-500 group-hover:scale-[1.045]`}
      />
      <span className="vf-tick vf-tl" />
      <span className="vf-tick vf-tr" />
      <span className="vf-tick vf-bl" />
      <span className="vf-tick vf-br" />
      <figcaption
        className="absolute inset-x-0 bottom-0 z-[2] flex items-center justify-between gap-2 px-3 py-1.5 font-mono text-[0.64rem] font-bold uppercase tracking-[0.16em] text-paper"
        style={{ background: "rgba(18,32,25,0.82)" }}
      >
        <span className="truncate">{caption}</span>
        <span className="shrink-0 text-amber">{meta}</span>
      </figcaption>
    </figure>
  );
}
