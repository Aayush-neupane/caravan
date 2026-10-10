import { NextResponse } from "next/server";
import { z } from "zod";
import { rateKey, rateLimit } from "./rateLimit";

// Operator-entered text that renders on public pages or to customers.
// React escapes on render; this additionally keeps raw markup (and any
// future innerHTML use) out of the database at the door.
export const cleanText = (min: number, max: number) =>
  z.string().min(min).max(max).regex(/^[^<>]*$/, "Angle brackets are not allowed.");

// CSRF defence-in-depth for cookie-authed mutations (SameSite=Lax is the
// first layer). Browsers attach Origin (or Referer) to POST/PATCH/DELETE;
// both must match this host when present. In production the expected host
// pins to NEXT_PUBLIC_APP_URL when set, so Host+Origin pair-spoofing past a
// misconfigured proxy fails closed. Non-browser clients sending neither
// header (curl, Stripe webhooks) are unaffected.
export function assertSameOrigin(req: Request): boolean {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  if (!host) return true;
  if (process.env.NODE_ENV === "production") {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    if (appUrl) {
      try {
        const expected = new URL(appUrl).host.toLowerCase();
        if (host !== expected) return false;
      } catch {
        /* malformed env — fall back to relative check */
      }
    }
  }
  const of = (u: string): string => {
    try {
      return new URL(u).host.toLowerCase();
    } catch {
      return "";
    }
  };
  const origin = req.headers.get("origin");
  if (origin) return of(origin) === host;
  const referer = req.headers.get("referer");
  if (referer) return of(referer) === host;
  return true;
}

export function originDenied(): NextResponse {
  return NextResponse.json({ error: "Cross-site request refused." }, { status: 403 });
}

// Real calendar date (a bare regex accepts 2026-13-40, which becomes
// Invalid Date downstream and 500s). Use for every YYYY-MM-DD input.
export function isCalendarDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// Shared gate for mutating routes: same-origin + per-IP rate budget.
// Returns a 4xx response when the request must be refused, else null.
export function gateMutation(
  req: Request,
  scope: string,
  max: number,
  windowMs: number
): NextResponse | null {
  if (!assertSameOrigin(req)) return originDenied();
  const r = rateLimit(rateKey(req, scope), max, windowMs);
  if (!r.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "retry-after": String(r.retryAfterSec) } }
    );
  }
  return null;
}
