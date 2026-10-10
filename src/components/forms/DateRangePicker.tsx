"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { addDays, parseISODate, toISODate } from "@/lib/format";

export type BlockedSet = Set<string>;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function fmtShort(iso: string): string {
  const d = parseISODate(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)}`;
}

function nightsBetweenISO(a: string, b: string): number {
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / 86400000);
}

/* ---------------------------------- grid ---------------------------------- */

function MonthGrid({
  year,
  month,
  pickup,
  ret,
  hover,
  blocked,
  minISO,
  onPick,
  onHover,
  registerDay,
  onArrow,
}: {
  year: number;
  month: number;
  pickup: string | null;
  ret: string | null;
  hover: string | null;
  blocked: BlockedSet;
  minISO: string;
  onPick: (iso: string) => void;
  onHover: (iso: string | null) => void;
  registerDay: (iso: string, el: HTMLButtonElement | null) => void;
  onArrow: (fromISO: string, dx: number, dy: number) => void;
}) {
  const first = new Date(Date.UTC(year, month, 1));
  const lead = (first.getUTCDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [...Array<null>(lead).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) cells.push(toISODate(new Date(Date.UTC(year, month, d))));

  const previewEnd = !ret && pickup && hover && hover > pickup ? hover : null;

  const inRange = (iso: string) => {
    if (pickup && ret && iso > pickup && iso < ret) return true;
    if (previewEnd && pickup && iso > pickup && iso <= previewEnd) return true;
    return false;
  };

  return (
    <div role="grid" aria-label={`${MONTHS[month]} ${year}`}>
      <div className="grid grid-cols-7 gap-0.5" role="row">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1 text-center text-[0.68rem] font-bold uppercase tracking-wider text-muted" role="columnheader">
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5" onMouseLeave={() => onHover(null)}>
        {cells.map((iso, i) => {
          if (!iso) return <span key={`blank-${i}`} />;
          const disabled = iso < minISO || blocked.has(iso);
          const isStart = iso === pickup;
          const isEnd = iso === ret || iso === previewEnd;
          const range = inRange(iso);
          const today = iso === toISODate(new Date());
          const labelBits = [
            parseISODate(iso).toUTCString().slice(0, 16),
            blocked.has(iso) ? "unavailable" : "",
            isStart ? "pickup" : "",
            iso === ret ? "return" : "",
          ].filter(Boolean).join(", ");
          return (
            <button
              key={iso}
              ref={(el) => registerDay(iso, el)}
              data-date={iso}
              type="button"
              role="gridcell"
              aria-selected={isStart || iso === ret}
              aria-disabled={disabled || undefined}
              aria-label={labelBits}
              disabled={disabled}
              onClick={() => onPick(iso)}
              onMouseEnter={() => onHover(iso)}
              onFocus={() => onHover(iso)}
              onKeyDown={(e) => {
                const map: Record<string, [number, number]> = {
                  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
                };
                const d = map[e.key];
                if (d) { e.preventDefault(); onArrow(iso, d[0], d[1]); }
              }}
              className={[
                "flex h-10 w-full items-center justify-center text-[0.86rem] transition-colors",
                disabled
                  ? "cursor-not-allowed text-charcoal/25 line-through decoration-charcoal/30"
                  : "cursor-pointer text-charcoal hover:bg-sand",
                isStart || isEnd ? "!bg-forest font-bold !text-white hover:!bg-forest" : "",
                range ? "bg-forest/10 font-semibold" : "",
                today && !isStart && !isEnd ? "underline decoration-amber decoration-2 underline-offset-4" : "",
              ].join(" ")}
              style={{ borderRadius: isStart || isEnd ? 6 : 3 }}
            >
              {parseISODate(iso).getUTCDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------- field --------------------------------- */

export function DateRangeField({
  pickup,
  ret,
  onChange,
  slug,
  minNoticeDays = 2,
  label = "Dates",
  id,
}: {
  pickup: string;
  ret: string;
  onChange: (pickup: string, ret: string) => void;
  slug?: string;
  minNoticeDays?: number;
  label?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [blocked, setBlocked] = useState<BlockedSet>(new Set());
  const [hover, setHover] = useState<string | null>(null);
  const [localPickup, setLocalPickup] = useState<string | null>(pickup || null);
  const [localRet, setLocalRet] = useState<string | null>(ret || null);
  const [announce, setAnnounce] = useState("");
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const dayEls = useRef(new Map<string, HTMLButtonElement>());

  const d = new Date();
  d.setDate(d.getDate() + minNoticeDays);
  const minISO = toISODate(d);

  const startView = parseISODate(pickup || minISO);
  const [view, setView] = useState({ y: startView.getUTCFullYear(), m: startView.getUTCMonth() });

  // Fetch blocked nights for the caravan when the popover opens.
  useEffect(() => {
    if (!open || !slug) return;
    let live = true;
    fetch(`/api/calendar?slug=${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (live && j?.nights) setBlocked(new Set(j.nights as string[])); })
      .catch(() => {});
    return () => { live = false; };
  }, [open, slug]);

  // Close on outside click / Escape, return focus to trigger.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open ]);

  // Sync when parent dates change externally.
  useEffect(() => {
    if (!open) { setLocalPickup(pickup || null); setLocalRet(ret || null); }
  }, [pickup, ret, open]);

  const pick = useCallback((iso: string) => {
    if (!localPickup || (localPickup && localRet)) {
      setLocalPickup(iso); setLocalRet(null);
      setAnnounce(`Pickup ${fmtShort(iso)} selected. Now choose a return date.`);
    } else if (iso === localPickup) {
      setLocalRet(null);
    } else if (iso > localPickup) {
      // Refuse ranges crossing a blocked night.
      let cur = parseISODate(localPickup);
      const end = parseISODate(iso);
      let clash = false;
      while (cur < end) {
        const s = toISODate(cur);
        if (s !== localPickup && blocked.has(s)) { clash = true; break; }
        cur = addDays(cur, 1);
      }
      if (clash) {
        setAnnounce("Those dates include unavailable nights. Choose a shorter range.");
        return;
      }
      setLocalRet(iso);
      setAnnounce(`Return ${fmtShort(iso)} selected. ${nightsBetweenISO(localPickup, iso)} nights.`);
    } else {
      setLocalPickup(iso); setLocalRet(null);
      setAnnounce(`Pickup ${fmtShort(iso)} selected. Now choose a return date.`);
    }
  }, [localPickup, localRet, blocked]);

  const arrow = useCallback((fromISO: string, dx: number, dy: number) => {
    const from = parseISODate(fromISO);
    const to = new Date(from);
    to.setUTCDate(to.getUTCDate() + dx + dy * 7);
    const el = dayEls.current.get(toISODate(to));
    if (el && !el.disabled) el.focus();
  }, []);

  const stepMonth = (dir: number) =>
    setView((v) => {
      const m = v.m + dir;
      return { y: v.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
    });

  const valid = localPickup && localRet && localRet > localPickup;
  const nights = valid ? nightsBetweenISO(localPickup, localRet) : 0;

  const summary = pickup && ret && ret > pickup
    ? `${fmtShort(pickup)} → ${fmtShort(ret)} · ${nightsBetweenISO(pickup, ret)}n`
    : "Choose dates";

  return (
    <div ref={wrapRef} className="relative">
      <span className="field-label" id={id ? `${id}-label` : undefined}>{label}</span>
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="field-input flex items-center justify-between gap-2 text-left"
      >
        <span className={pickup && ret ? "font-semibold text-charcoal" : "text-muted"}>{summary}</span>
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Choose pickup and return dates"
            initial={reduce ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="absolute left-0 top-full z-50 mt-2 w-[19.5rem] border border-border bg-white p-4 shadow-[0_8px_30px_rgba(26,43,35,0.14)]"
            style={{ borderRadius: 10 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <button type="button" onClick={() => stepMonth(-1)} aria-label="Previous month" className="border border-border px-2.5 py-1 text-sm font-bold hover:border-forest" style={{ borderRadius: 6 }}>←</button>
              <p className="font-display text-lg" aria-live="polite">{MONTHS[view.m]} {view.y}</p>
              <button type="button" onClick={() => stepMonth(1)} aria-label="Next month" className="border border-border px-2.5 py-1 text-sm font-bold hover:border-forest" style={{ borderRadius: 6 }}>→</button>
            </div>

            <MonthGrid
              year={view.y} month={view.m}
              pickup={localPickup} ret={localRet} hover={hover}
              blocked={blocked} minISO={minISO}
              onPick={pick} onHover={setHover}
              registerDay={(iso, el) => { if (el) dayEls.current.set(iso, el); }}
              onArrow={arrow}
            />

            <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-[0.75rem] text-muted">
              <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 bg-forest" style={{ borderRadius: 2 }} /> Selected</span>
              <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 bg-forest/10" style={{ borderRadius: 2 }} /> In range</span>
              <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 bg-charcoal/20 line-through" style={{ borderRadius: 2 }} /> Taken</span>
            </div>

            <p className="mt-2 min-h-[1.4em] text-[0.8rem] text-muted" role="status" aria-live="polite">
              {valid ? `${fmtShort(localPickup!)} → ${fmtShort(localRet!)} · ${nights} night${nights > 1 ? "s" : ""}` : "Pick a pickup date, then a return date."}
            </p>
            <p className="sr-only" role="status">{announce}</p>

            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => { setLocalPickup(null); setLocalRet(null); }}
                className="btn-secondary flex-1 !py-2 !text-[0.83rem]"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={!valid}
                onClick={() => { if (valid) { onChange(localPickup!, localRet!); setOpen(false); } }}
                className="btn-primary flex-1 !py-2 !text-[0.83rem] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
