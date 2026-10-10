// Runs once when the Next.js server starts (Node runtime only).
// Fails fast in production when required secrets are missing, instead of
// serving traffic with demo fallbacks.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertEnv } = await import("./lib/env");
    assertEnv();
  }
}
