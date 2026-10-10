import { randomInt } from "crypto";

export const CURRENCY = "AUD";

// Primary formatter for the Melbourne operation. `gbp` is kept as a
// deprecated alias so older imports keep working.
export function aud(cents: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/** @deprecated Use `aud()` — same minor-unit input, AUD output. */
export function gbp(pence: number): string {
  return aud(pence);
}

export function nightsBetween(pickup: Date, ret: Date): number {
  const ms = ret.getTime() - pickup.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseISODate(s: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error("Invalid date");
  const [y, m, d] = s.split("-").map(Number);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) throw new Error("Invalid date");
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    throw new Error("Invalid date");
  }
  return dt;
}

// Strict alias — throws on any non-calendar YYYY-MM-DD (same as parseISODate).
export function parseISODateStrict(s: string): Date {
  return parseISODate(s);
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setUTCDate(c.getUTCDate() + n);
  return c;
}

export function dateRangeNights(pickupISO: string, returnISO: string): string[] {
  const out: string[] = [];
  let cur = parseISODate(pickupISO);
  const end = parseISODate(returnISO);
  while (cur < end) {
    out.push(toISODate(cur));
    cur = addDays(cur, 1);
  }
  return out;
}

export function makeReference(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "WW-";
  for (let i = 0; i < 6; i++) s += chars[randomInt(0, chars.length)];
  return s;
}
