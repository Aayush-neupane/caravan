import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Unauthenticated liveness/readiness probe for Docker/K8s and uptime checks.
// No auth — returns 503 when the database is unreachable. No version or
// internal details are disclosed; failures are logged without PII.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "up" });
  } catch {
    console.error("[health:error] db unreachable");
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}
