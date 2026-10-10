import { prisma } from "@/lib/db";
import { PREP_BUFFER_DAYS, blockingNow, liveHoldBookingIds } from "./engine";
import { BLOCKING_STATUSES } from "@/features/bookings/stateMachine";
import { addDays, toISODate } from "@/lib/format";

// Server-only: effective blocked nights (pickup-inclusive, buffer included)
// for one caravan, merged from bookings, live holds, manual blocks and
// maintenance. Returned as ISO date strings the calendar disables.

export async function getBlockedNights(slug: string): Promise<{
  nights: string[];
  minNights: number;
  maxNights: number;
  maxTravellers: number;
}> {
  const caravan = await prisma.caravan.findUnique({
    where: { slug },
    include: {
      bookings: { where: { status: { in: [...BLOCKING_STATUSES] } } },
      holds: true,
      blocks: true,
      maintenance: { where: { done: false } },
    },
  });
  if (!caravan) throw new Error("Unknown caravan.");

  const now = new Date();
  // A `held` booking only blocks while its hold is live: expired holds mean
  // the guest walked away, so those dates are bookable again immediately —
  // the sweep (GET/POST /api/cron/expire-holds) flips the row to `expired`.
  const liveHeldIds = liveHoldBookingIds(caravan.holds, now);
  const blockingBookings = blockingNow(caravan.bookings, liveHeldIds);
  // Cutoff guard: drop intervals that ended before yesterday so booking
  // history cannot accumulate unboundedly in the calendar loop.
  const cutoff = addDays(now, -1);
  const intervals = [
    ...blockingBookings.map((b) => ({ start: new Date(b.pickupDate), end: new Date(b.returnDate) })),
    ...caravan.holds.filter((h) => new Date(h.expiresAt) > now).map((h) => ({ start: new Date(h.pickupDate), end: new Date(h.returnDate) })),
    ...caravan.blocks.map((b) => ({ start: new Date(b.startDate), end: new Date(b.endDate) })),
    ...caravan.maintenance.map((m) => ({ start: new Date(m.startDate), end: new Date(m.endDate) })),
  ].filter((iv) => iv.end > cutoff);

  const nights = new Set<string>();
  for (const iv of intervals) {
    const end = addDays(iv.end, PREP_BUFFER_DAYS);
    let cur = new Date(iv.start);
    let guard = 0;
    while (cur < end && guard++ < 366) {
      nights.add(toISODate(cur));
      cur = addDays(cur, 1);
    }
  }
  return {
    nights: [...nights].sort(),
    minNights: caravan.minNights,
    maxNights: caravan.maxNights,
    maxTravellers: caravan.maxTravellers,
  };
}
