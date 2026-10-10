import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { canTransition } from "@/features/bookings/stateMachine";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// GET|POST /api/cron/expire-holds — abandoned-hold sweep.
//
// Online reservations are created `held` with a 20-minute BookingHold. If the
// guest abandons the flow that booking would otherwise sit in BLOCKING_STATUSES
// forever, permanently blocking inventory. This sweep flips those rows to
// `expired` (a legal held → expired transition) so the dates free up
// immediately; every availability read already ignores `held` rows whose hold
// lapsed, so this is bookkeeping, not the gate itself.
//
// Schedule every 5 minutes, e.g. Vercel Cron (vercel.json):
//   { "crons": [{ "path": "/api/cron/expire-holds", "schedule": "*/5 * * * *" }] }
// or any external scheduler:  curl -H "authorization: Bearer $CRON_SECRET" \
//   https://<host>/api/cron/expire-holds
// CRON_SECRET must be set (503 when unset in production — never run the sweep
// unauthenticated, it moves reservation state).

const MAX_PER_RUN = 500;// Bookings with no hold at all (seed data / legacy rows) are only swept once
// they are clearly abandoned: a held row older than this with no hold cannot
// have been created by checkout, which always writes a hold in the same txn.
const ORPHAN_GRACE_MS = 30 * 60 * 1000;

// Constant-time bearer comparison (a plain === leaks timing on the secret).
function authorized(req: Request, secret: string): boolean {
  const header = req.headers.get("authorization") ?? "";
  const token = (header.startsWith("Bearer ") ? header.slice(7) : header).trim();
  if (!token || token.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= secret.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}

async function sweep(req: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured — hold expiry sweep is disabled." },
      { status: 503 }
    );
  }
  if (!authorized(req, secret)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const now = new Date();
  const orphanCutoff = new Date(now.getTime() - ORPHAN_GRACE_MS);

  // Candidates: still `held`, bounded per run. The latest hold decides — an
  // earlier expired hold means nothing once a newer live hold exists.
  const held = await prisma.booking.findMany({
    where: { status: "held" },
    select: {
      id: true,
      reference: true,
      createdAt: true,
      holds: { orderBy: { expiresAt: "desc" }, take: 1, select: { expiresAt: true } },
    },
    orderBy: { createdAt: "asc" },
    take: MAX_PER_RUN,
  });

  const expiredIds: string[] = [];
  for (const b of held) {
    const latest = b.holds[0];
    const lapsed = latest ? new Date(latest.expiresAt) <= now : b.createdAt < orphanCutoff;
    if (!lapsed) continue;
    if (!canTransition("held", "expired")) break; // state machine changed — never bypass it

    try {
      const expired = await prisma.$transaction(async (tx) => {
        // Guard on the status so a concurrent staff transition wins: the
        // sweep only moves rows nobody else has already moved.
        const moved = await tx.booking.updateMany({ where: { id: b.id, status: "held" }, data: { status: "expired" } });
        if (moved.count === 0) return false;
        await tx.bookingStatusHistory.create({
          data: {
            bookingId: b.id,
            from: "held",
            to: "expired",
            actor: "system",
            note: latest
              ? `Reservation hold expired ${new Date(latest.expiresAt).toISOString()} — dates released automatically`
              : "Held reservation with no hold record and older than the 30-minute grace window — dates released automatically",
          },
        });
        await tx.auditLog.create({
          data: {
            action: "booking:expire",
            resource: "booking",
            resourceId: b.id,
            detail: `${b.reference} held → expired by hold-expiry sweep${latest ? "" : " (orphan hold)"}`,
          },
        });
        return true;
      });
      if (expired) expiredIds.push(b.id);
    } catch (e) {
      // One bad row must not abort the whole sweep; the next run retries it.
      logger.error("[cron/expire-holds] row failed", { code: (e as Error).message?.slice(0, 120) });
    }
  }

  return NextResponse.json({ expiredIds, swept: held.length, at: now.toISOString() });
}

export async function POST(req: Request) {
  return sweep(req);
}

export async function GET(req: Request) {
  // Vercel Cron invokes GET; bearer auth makes this safe against CSRF
  // (browsers never attach the Authorization header cross-site).
  return sweep(req);
}
