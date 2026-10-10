// Best-effort in-process rate limiting (per instance). Every mutating public
// API checks in here and answers 429 + Retry-After instead of serving abuse.
//
// PRODUCTION: set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN for shared
// enforcement across replicas (see README “Rate limiting”). Without it, limits
// are per-instance — fine for a single container, bypassable behind >1.
// TRUST_PROXY=1 only when a trusted proxy/CDN strips spoofed X-Forwarded-For;
// otherwise XFF is ignored and x-real-ip is used, so header rotation cannot
// reset budgets.

type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

// LRU-ish cap: Map preserves insertion order, so evict oldest first.
const MAX_BUCKETS = 5000;

// Prune occasionally so the maps cannot grow without bound.
let ops = 0;

function sweep(): void {
  if (++ops % 500 !== 0) return;
  try {
    const now = Date.now();
    for (const [k, b] of buckets) if (now > b.reset) buckets.delete(k);
    for (const [k, f] of fails) if (now > f.reset) fails.delete(k);
    while (buckets.size > MAX_BUCKETS) {
      const oldest = buckets.keys().next();
      if (oldest.done) break;
      buckets.delete(oldest.value);
    }
    while (fails.size > MAX_BUCKETS) {
      const oldest = fails.keys().next();
      if (oldest.done) break;
      fails.delete(oldest.value);
    }
  } catch {
    /* sweep must never break the request path */
  }
}

export function rateLimit(
  key: string,
  max: number,
  windowMs: number
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  sweep();
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
  // Only trust X-Forwarded-For behind an explicitly trusted proxy. This
  // closes the XFF-rotation bypass on direct-to-origin deploys while keeping
  // correct per-client buckets on Vercel / trusted CDN setups.
  if (process.env.TRUST_PROXY === "1") {
    const fwd = req.headers.get("x-forwarded-for");
    const ip = (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim();
    return ip.slice(0, 64) || "local";
  }
  const direct = (req.headers.get("x-real-ip") ?? "").trim();
  return (direct || "direct").slice(0, 64);
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

export function resetRateLimitForTests(): void {
  buckets.clear();
  fails.clear();
}
