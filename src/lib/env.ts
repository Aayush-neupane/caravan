import { z } from "zod";

// Central env validation. Importing this module does NOT throw at build
// time for prod-only secrets (HANDOVER_OTP_SECRET is checked at runtime via
// assertEnv() so `next build` without runtime secrets still succeeds).
const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL must be set."),
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 chars."),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL."),
  HANDOVER_OTP_SECRET: z.string().min(32, "HANDOVER_OTP_SECRET must be at least 32 chars.").optional(),
  RESEND_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

function parseEnv() {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // Warn (not throw) at import so builds/tests without full env still run;
    // enforce strictly in production via assertEnv().
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Invalid environment: ${parsed.error.message}`);
    }
    return EnvSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://localhost:5432/caravan",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "dev-secret-please-set-a-32-char-value-here",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      HANDOVER_OTP_SECRET: process.env.HANDOVER_OTP_SECRET,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      NODE_ENV: process.env.NODE_ENV ?? "development",
    });
  }
  return parsed.data;
}

export const env = parseEnv();

// Call at server startup (or in sensitive routes) to fail fast when
// production secrets are missing. Fails CLOSED: demo logins, demo passwords,
// and short/placeholder secrets never boot in production.
export function assertEnv(): void {
  if (process.env.NODE_ENV !== "production") return;
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid production environment: ${result.error.message}`);
  }
  if (!process.env.HANDOVER_OTP_SECRET) {
    throw new Error("HANDOVER_OTP_SECRET must be set in production.");
  }
  if (process.env.AUTH_ALLOW_DEMO === "true") {
    throw new Error("AUTH_ALLOW_DEMO must not be true in production.");
  }
  if (process.env.DEMO_OWNER_PASSWORD) {
    throw new Error("DEMO_OWNER_PASSWORD must not be set in production.");
  }
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    // Single-instance safe; warn loudly so multi-replica deploys notice.
    console.warn(
      "[env] UPSTASH_REDIS_REST_URL/TOKEN unset — rate limiting is per-instance. Set both before horizontal scaling."
    );
  }
}
