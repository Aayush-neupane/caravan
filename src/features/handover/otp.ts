import { createHmac, timingSafeEqual } from "crypto";

// Handover OTP: proves the guest is at the counter (controls their inbox)
// before staff activate the hire. Stateless TOTP-style design — no database
// migration: the code is HMAC(server secret, booking + 10-minute window), so
// verification recomputes instead of storing secrets. Codes are valid up to
// 20 minutes (current + previous 10-min window tolerance); brute force is
// capped by per-booking attempt budgets in the route handler.

export const OTP_WINDOW_MS = 10 * 60 * 1000;
export const OTP_SEND_MAX = 3; // sends per window per booking (anti-spam)
export const OTP_TRY_MAX = 5; // guesses per window per booking

function secret(): string {
  const s =
    process.env.HANDOVER_OTP_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : process.env.NEXTAUTH_SECRET) ??
    (process.env.NODE_ENV === "production" ? undefined : "dev-otp-secret-change-me-32chars!!");
  if (!s) {
    throw new Error("HANDOVER_OTP_SECRET must be set in production.");
  }
  if (s.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("HANDOVER_OTP_SECRET must be at least 32 chars in production.");
    }
    console.warn("[otp] HANDOVER_OTP_SECRET is short — use ≥32 chars in production.");
  }
  return s;
}

export function otpSlot(now = Date.now()): number {
  return Math.floor(now / OTP_WINDOW_MS);
}

export function otpFor(bookingId: string, slot: number): string {
  const digest = createHmac("sha256", secret()).update(`${bookingId}:${slot}`).digest();
  return String(digest.readUInt32BE(0) % 1_000_000).padStart(6, "0");
}

export function verifyOtp(bookingId: string, code: string | undefined | null, now = Date.now()): boolean {
  const clean = (code ?? "").replace(/\D/g, "").slice(0, 6);
  if (clean.length !== 6) return false;
  const slot = otpSlot(now);
  for (const s of [slot, slot - 1]) {
    const expected = otpFor(bookingId, s);
    if (clean.length === expected.length && timingSafeEqual(Buffer.from(clean), Buffer.from(expected))) {
      return true;
    }
  }
  return false;
}
