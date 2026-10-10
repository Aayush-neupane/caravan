export const CURRENCY = "GBP";

export function gbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(pence / 100);
}

export function nightsBetween(pickup: Date, ret: Date): number {
  const ms = ret.getTime() - pickup.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
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
  let s = "HM-";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
