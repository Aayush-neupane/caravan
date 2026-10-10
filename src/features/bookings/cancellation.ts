// Tiered cancellation refunds (policy v2026.1, matching on-page copy).
// Bands are computed from whole days between cancellation and pickup:
//   28+ days → full refund of total
//   14–27 days → 50% of total
//   <14 days → deposit retained (no refund on held/ unpaid reservations;
//             paid deposits are retained — refund 0 here, staff may vary).
// Amounts round down to whole cents. Never exceeds totalPence.

export function cancellationRefundPence(totalPence: number, daysBeforePickup: number): number {
  if (totalPence <= 0) return 0;
  if (daysBeforePickup >= 28) return totalPence;
  if (daysBeforePickup >= 14) return Math.floor(totalPence / 2);
  return 0;
}

export function daysBeforePickup(pickupDate: Date, now = new Date()): number {
  const ms = pickupDate.getTime() - now.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function cancellationBand(daysBeforePickup: number): "full" | "half" | "deposit_retained" {
  if (daysBeforePickup >= 28) return "full";
  if (daysBeforePickup >= 14) return "half";
  return "deposit_retained";
}
