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
  // Two-sided prep buffer: each stay occupies [start, end + buffer).
  // Buffer the request as well so a request ending where another begins
  // (its own prep day colliding) is correctly rejected.
  const req = withBuffer(requested, bufferDays);
  for (const e of existing) {
    const booked = withBuffer(e, bufferDays);
    if (overlaps(req, booked)) return { ok: false, conflict: e };
  }
  return { ok: true };
}

export type HoldLike = { bookingId: string | null; expiresAt: Date };

// A `held` reservation only blocks inventory while its hold is live. Once
// the hold expires the guest has walked away: the cron sweep flips the
// booking to `expired` and the dates must free up immediately, so every
// availability read ignores held rows without a live hold (fail-open for
// honest inventory, fail-closed nowhere — an expired hold is not inventory).
export function holdIsLive(expiresAt: Date, now: Date = new Date()): boolean {
  return new Date(expiresAt).getTime() > now.getTime();
}

export function liveHoldBookingIds(holds: HoldLike[], now: Date = new Date()): Set<string> {
  return new Set(
    holds.filter((h) => h.bookingId && holdIsLive(h.expiresAt, now)).map((h) => h.bookingId as string)
  );
}

// Filters blocking-status bookings down to the ones that genuinely hold
// inventory: everything except `held`, plus `held` with a live hold.
export function blockingNow<T extends { id: string; status: string }>(bookings: T[], liveHeldIds: Set<string>): T[] {
  return bookings.filter((b) => b.status !== "held" || liveHeldIds.has(b.id));
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
    // Calendar-day notice: compare date-only (UTC midnight) so an evening
    // booking 2 calendar days out is not rejected for being <48h away.
    const pickupDay = Date.UTC(pickup.getUTCFullYear(), pickup.getUTCMonth(), pickup.getUTCDate());
    const nowDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const noticeDays = Math.round((pickupDay - nowDay) / 86400000);
    if (noticeDays < opts.minNoticeDays) return `Please allow at least ${opts.minNoticeDays} days' notice before collection.`;
  }
  if (opts.earliest && pickup < opts.earliest) return "Pickup is before the earliest bookable date.";
  if (opts.latest && ret > opts.latest) return "Return is beyond the maximum advance booking window.";
  return null;
}
