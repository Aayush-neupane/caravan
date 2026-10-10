"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type SelectOption = { value: string; label: string; hint?: string };

// Accessible custom dropdown: button + listbox with full keyboard support.
// Replaces native selects in customer-facing UI for a consistent look.
export function Select({
  label,
  value,
  options,
  onChange,
  id,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => Math.max(0, options.findIndex((o) => o.value === value)));
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnId = id ?? `select-${uid}`;
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open ]);

  useEffect(() => {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
  }, [value, options]);

  // Keep the active option in view when stepping with the keyboard.
  useEffect(() => {
    if (!open) return;
    const el = document.getElementById(`${btnId}-opt-${active}`);
    el?.scrollIntoView({ block: "nearest" });
  }, [open, active, btnId]);

  function choose(v: string) {
    onChange(v);
    setOpen(false);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setActive((a) => (e.key === "ArrowDown" ? Math.min(options.length - 1, a + 1) : Math.max(0, a - 1)));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) choose(options[active].value);
      else setOpen(true);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Home") {
      if (open) { e.preventDefault(); setActive(0); }
    } else if (e.key === "End") {
      if (open) { e.preventDefault(); setActive(options.length - 1); }
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <span className="field-label" id={`${btnId}-label`}>{label}</span>
      <button
        id={btnId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${btnId}-label ${btnId}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKey}
        className="field-input flex items-center justify-between gap-2 text-left"
      >
        <span className="truncate font-medium">{current?.label ?? "Select"}</span>
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-labelledby={`${btnId}-label`}
            aria-activedescendant={`${btnId}-opt-${active}`}
            tabIndex={-1}
            initial={reduce ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto border border-border bg-white py-1 shadow-[0_8px_30px_rgba(26,43,35,0.14)] rounded-lg"
          >
            {options.map((o, i) => {
              const selected = o.value === value;
              return (
                <li
                  key={o.value}
                  id={`${btnId}-opt-${i}`}
                  role="option"
                  aria-selected={selected}
                  tabIndex={-1}
                  onClick={() => choose(o.value)}
                  onKeyDown={onKey}
                  onMouseEnter={() => setActive(i)}
                  className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-[0.9rem] ${
                    i === active ? "bg-sand/70" : ""
                  } ${selected ? "font-bold text-forest" : "text-charcoal"}`}
                >
                  <span>{o.label}{o.hint ? <span className="ml-2 font-normal text-muted">{o.hint}</span> : null}</span>
                  {selected && (
                    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0 text-forest">
                      <path d="M3 8.5l3.5 3.5L13 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
