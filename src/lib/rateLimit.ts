// Best-effort in-process rate limiting (per instance; use Redis/Upstash in
// production for shared enforcement). Every mutating public API checks in
// here and answers 429 + Retry-After instead of serving abuse.

type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

// Prune occasionally so the map cannot grow without bound.
let ops = 0;

export function rateLimit(
  key: string,
  max: number,
  windowMs: number
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  if (++ops % 500 === 0) {
    for (const [k, b] of buckets) if (now > b.reset) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (b.count >= max) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((b.reset - now) / 1000)) };
  }
  b.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim();
  return ip.slice(0, 64) || "local";
}

export function rateKey(req: Request, scope: string): string {
  return `${scope}:${clientIp(req)}`;
}

// Brute-force guard for credential checks: 5 failures per 15 minutes per
// key (email or IP), then hard reject until the window lapses.
const fails = new Map<string, { count: number; reset: number }>();

export function recordAuthFailure(key: string): void {
  const now = Date.now();
  const f = fails.get(key);
  if (!f || now > f.reset) fails.set(key, { count: 1, reset: now + 15 * 60 * 1000 });
  else f.count += 1;
}

export function authLockedOut(key: string): boolean {
  const f = fails.get(key);
  if (!f) return false;
  if (Date.now() > f.reset) {
    fails.delete(key);
    return false;
  }
  return f.count >= 5;
}

export function clearAuthFailures(key: string): void {
  fails.delete(key);
}
