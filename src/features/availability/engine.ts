// Availability: pickup-inclusive, return-exclusive + preparation buffer.
// Two intervals [a,b) and [c,d) overlap iff a < d && c < b.

export const PREP_BUFFER_DAYS = 1;

export type Interval = { start: Date; end: Date };

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

export function withBuffer(iv: Interval, bufferDays = PREP_BUFFER_DAYS): Interval {
  const end = new Date(iv.end);
  end.setUTCDate(end.getUTCDate() + bufferDays);
  return { start: iv.start, end };
}

export function isAvailable(
  requested: Interval,
  existing: Interval[],
  bufferDays = PREP_BUFFER_DAYS
): { ok: boolean; conflict?: Interval } {
  const req = withBuffer(requested, 0); // buffer already baked into existing
  for (const e of existing) {
    const booked = withBuffer(e, bufferDays);
    if (overlaps(req, booked)) return { ok: false, conflict: e };
  }
  return { ok: true };
}

export function validateStay(
  pickup: Date,
  ret: Date,
  opts: { minNights: number; maxNights: number; earliest?: Date; latest?: Date; minNoticeDays?: number; now?: Date }
): string | null {
  const nights = Math.round((ret.getTime() - pickup.getTime()) / 86400000);
  if (!(ret > pickup)) return "Return date must be after pickup date.";
  if (nights < opts.minNights) return `Minimum stay is ${opts.minNights} nights for this caravan.`;
  if (nights > opts.maxNights) return `Maximum stay is ${opts.maxNights} nights for this caravan.`;
  const now = opts.now ?? new Date();
  if (opts.minNoticeDays) {
    const notice = (pickup.getTime() - now.getTime()) / 86400000;
    if (notice < opts.minNoticeDays) return `Please allow at least ${opts.minNoticeDays} days' notice before collection.`;
  }
  if (opts.earliest && pickup < opts.earliest) return "Pickup is before the earliest bookable date.";
  if (opts.latest && ret > opts.latest) return "Return is beyond the maximum advance booking window.";
  return null;
}
