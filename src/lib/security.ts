import { NextResponse } from "next/server";
import { rateKey, rateLimit } from "./rateLimit";

// CSRF defence-in-depth for cookie-authed mutations (SameSite=Lax is the
// first layer). Browsers attach Origin (or Referer) to POST/PATCH/DELETE;
// both must match this host when present. Non-browser clients sending
// neither header (curl, Stripe webhooks) are unaffected.
export function assertSameOrigin(req: Request): boolean {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  if (!host) return true;
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
