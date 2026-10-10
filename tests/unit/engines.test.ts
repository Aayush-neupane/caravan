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

  it("applies seasonal multiplier and percent coupon", () => {
    const q = priceQuote({ ...base, seasonalMultiplierPct: 120, pickupISO: "2026-07-13", returnISO: "2026-07-15", extras: [], couponKind: "percent", couponValue: 10 });
    expect(q.nightlySubtotalPence).toBe(Math.round(20000 * 1.2));
    expect(q.couponDiscountPence).toBeGreaterThan(0);
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
  it("blocks illegal transitions (e.g. completed → active)", () => {
    expect(canTransition("completed", "active")).toBe(false);
    expect(canTransition("cancelled", "confirmed")).toBe(false);
  });
});
