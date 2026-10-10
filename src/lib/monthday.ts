// Month-day helpers for seasonal pricing rules (MM-DD, wraparound aware).
// Kept out of route files: Next route modules may only export HTTP methods.

export function mdDay(md: string): number {
  const [m, d] = md.split("-").map(Number);
  return m * 100 + d;
}

// Real calendar check (regex alone accepts 02-31): month lengths, Feb 29 allowed.
export function isMonthDay(md: string): boolean {
  const m = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.exec(md);
  if (!m) return false;
  const month = Number(m[1]);
  const day = Number(m[2]);
  const days = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
  return day <= days;
}

export function mdOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const segs = (s: string, e: string): [number, number][] => {
    const a = mdDay(s);
    const b = mdDay(e);
    if (a <= b) return [[a, b]];
    return [
      [a, 1231],
      [101, b],
    ];
  };
  for (const [a1, a2] of segs(aStart, aEnd))
    for (const [b1, b2] of segs(bStart, bEnd)) if (a1 <= b2 && b1 <= a2) return true;
  return false;
}
