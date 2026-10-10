import { describe, it, expect } from "vitest";
import { priceQuote } from "@/features/pricing/engine";
import { isAvailable, validateStay } from "@/features/availability/engine";
import { canTransition } from "@/features/bookings/stateMachine";

const base = {
  baseNightlyPence: 10000,
  weekendNightlyPence: 12000,
  weeklyDiscountPct: 10,
  seasonalMultiplierPct: 100,
  cleaningFeePence: 7500,
  taxPct: 20,
  securityDepositPence: 50000,
  depositPct: 25,
};

describe("pricing engine", () => {
  it("prices 3 midweek nights with cleaning + VAT", () => {
    const q = priceQuote({ ...base, pickupISO: "2026-10-13", returnISO: "2026-10-16", extras: [] });
    expect(q.nights).toBe(3);
    expect(q.nightlySubtotalPence).toBe(30000);
    expect(q.taxPence).toBe(Math.round((30000 + 7500) * 0.2));
    expect(q.totalPence).toBe(30000 + 7500 + q.taxPence);
  });

  it("applies weekend rates on Fri/Sat nights", () => {
    const q = priceQuote({ ...base, pickupISO: "2026-10-16", returnISO: "2026-10-19", extras: [] });
    // Fri + Sat weekend, Sun base
    expect(q.nightlySubtotalPence).toBe(12000 + 12000 + 10000);
  });

  it("applies weekly discount per full 7-night block", () => {
    const q = priceQuote({ ...base, pickupISO: "2026-10-12", returnISO: "2026-10-19", extras: [] });
    expect(q.nights).toBe(7);
    expect(q.weeklyDiscountPence).toBe(Math.round(q.nightlySubtotalPence * 0.1));
  });

  it("pro-ratas weekly discount (8 nights earns 7/8 of the pct)", () => {
    const q = priceQuote({ ...base, pickupISO: "2026-10-12", returnISO: "2026-10-20", extras: [] });
    expect(q.nights).toBe(8);
    expect(q.weeklyDiscountPence).toBe(Math.round((q.nightlySubtotalPence * 7 * 0.1) / 8));
  });

  it("applies seasonal multiplier per night from each night's own date", () => {
    // 2026-09-04 (Fri) + 09-05 (Sat) are in high season ×1.2; 09-06+ are not.
    const q = priceQuote({ ...base, pickupISO: "2026-09-04", returnISO: "2026-09-08", extras: [] });
    expect(q.nights).toBe(4);
    const summer = q.nightLines.filter((n) => n.seasonalPct === 120);
    const normal = q.nightLines.filter((n) => n.seasonalPct === 100);
    expect(summer).toHaveLength(2);
    expect(normal).toHaveLength(2);
    // Fri/Sat nights at weekend rate ×1.2, Sun/Mon at base ×1.0
    expect(q.nightlySubtotalPence).toBe(
      Math.round(12000 * 1.2) + Math.round(12000 * 1.2) + 10000 + 10000
    );
    expect(q.seasonalUpliftPence).toBe(q.nightlySubtotalPence - q.nightlyBasePence);
    expect(q.nightlyBasePence).toBe(12000 + 12000 + 10000 + 10000);
  });

  it("applies percent coupons with a 60% cap and fixed coupons capped at subtotal", () => {
    const capped = priceQuote({ ...base, pickupISO: "2026-10-13", returnISO: "2026-10-15", extras: [], couponKind: "percent", couponValue: 90 });
    // Both coupon kinds share the pre-tax base (rental + fees + extras).
    expect(capped.couponDiscountPence).toBe(Math.round((capped.rentalSubtotalPence + capped.feesPence + capped.extrasPence) * 0.6));
    const fixed = priceQuote({ ...base, pickupISO: "2026-10-13", returnISO: "2026-10-15", extras: [], couponKind: "fixed", couponValue: 999999 });
    expect(fixed.couponDiscountPence).toBe(fixed.rentalSubtotalPence + fixed.feesPence + fixed.extrasPence);
    expect(fixed.subtotalExTaxPence).toBe(0);
  });

  it("prices per-night extras across the whole stay", () => {
    const q = priceQuote({ ...base, pickupISO: "2026-10-13", returnISO: "2026-10-16", extras: [{ unitPricePence: 1000, qty: 2, perNight: true }] });
    expect(q.nights).toBe(3);
    expect(q.extrasPence).toBe(6000);
  });

  it("keeps refundable deposit separate from revenue total", () => {
    const q = priceQuote({ ...base, pickupISO: "2026-10-13", returnISO: "2026-10-15", extras: [] });
    expect(q.securityDepositPence).toBe(50000);
    expect(q.totalPence).not.toContain?.(50000 as never);
    expect(q.totalPence).toBe(q.subtotalExTaxPence + q.taxPence);
  });

  it("rejects zero-night stays", () => {
    expect(() => priceQuote({ ...base, pickupISO: "2026-10-13", returnISO: "2026-10-13", extras: [] })).toThrow();
  });
});

describe("availability engine", () => {
  const d = (s: string) => new Date(`${s}T12:00:00Z`);
  it("detects overlap (pickup-inclusive, return-exclusive)", () => {
    const existing = [{ start: d("2026-08-01"), end: d("2026-08-05") }];
    expect(isAvailable({ start: d("2026-08-05"), end: d("2026-08-08") }, existing, 0).ok).toBe(true);
    expect(isAvailable({ start: d("2026-08-04"), end: d("2026-08-08") }, existing, 0).ok).toBe(false);
  });

  it("enforces preparation buffer", () => {
    const existing = [{ start: d("2026-08-01"), end: d("2026-08-05") }];
    expect(isAvailable({ start: d("2026-08-05"), end: d("2026-08-08") }, existing, 1).ok).toBe(false);
    expect(isAvailable({ start: d("2026-08-06"), end: d("2026-08-09") }, existing, 1).ok).toBe(true);
  });

  it("enforces the request's own prep day (leading buffer)", () => {
    // Request ending Aug 10 where an existing stay starts Aug 10: the
    // request's own Aug-10 prep day collides and must be rejected.
    const existing = [{ start: d("2026-08-10"), end: d("2026-08-15") }];
    expect(isAvailable({ start: d("2026-08-05"), end: d("2026-08-10") }, existing, 1).ok).toBe(false);
    expect(isAvailable({ start: d("2026-08-04"), end: d("2026-08-09") }, existing, 1).ok).toBe(true);
  });

  it("validates min/max stay and notice", () => {
    expect(validateStay(d("2026-08-01"), d("2026-08-02"), { minNights: 2, maxNights: 10 })).toMatch(/Minimum/);
    expect(validateStay(d("2026-08-01"), d("2026-09-01"), { minNights: 2, maxNights: 10 })).toMatch(/Maximum/);
  });
});

describe("booking state machine", () => {
  it("allows legal transitions", () => {
    expect(canTransition("held", "awaiting_payment")).toBe(true);
    expect(canTransition("awaiting_payment", "awaiting_documents")).toBe(true);
    expect(canTransition("confirmed", "ready")).toBe(true);
  });
  it("recovers payment_review into document review", () => {
    expect(canTransition("payment_review", "awaiting_documents")).toBe(true);
  });
  it("enforces the document gate (no direct payment → confirmed)", () => {
    expect(canTransition("awaiting_payment", "confirmed")).toBe(false);
  });
  it("blocks illegal transitions (e.g. completed → active)", () => {
    expect(canTransition("completed", "active")).toBe(false);
    expect(canTransition("cancelled", "confirmed")).toBe(false);
  });
});
