import { describe, it, expect } from "vitest";
import { cancellationBand, cancellationRefundPence } from "@/features/bookings/cancellation";

describe("cancellation tiers (policy v2026.1)", () => {
  it("refunds in full at 28+ days", () => {
    expect(cancellationRefundPence(100000, 28)).toBe(100000);
    expect(cancellationRefundPence(100000, 60)).toBe(100000);
    expect(cancellationBand(28)).toBe("full");
  });
  it("refunds half at 14–27 days", () => {
    expect(cancellationRefundPence(100001, 14)).toBe(Math.floor(100001 / 2));
    expect(cancellationRefundPence(100000, 27)).toBe(50000);
    expect(cancellationBand(20)).toBe("half");
  });
  it("retains the deposit within 14 days", () => {
    expect(cancellationRefundPence(100000, 13)).toBe(0);
    expect(cancellationRefundPence(100000, 0)).toBe(0);
    expect(cancellationBand(5)).toBe("deposit_retained");
  });
});
