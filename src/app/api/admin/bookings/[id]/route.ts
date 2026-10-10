import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, canAdminister } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertTransition, BOOKING_STATUSES } from "@/features/bookings/stateMachine";

const ActionSchema = z.object({ action: z.enum([...BOOKING_STATUSES, "refund_deposit"] as [string, ...string[]]) }).strict();

// PATCH /api/admin/bookings/:id — controlled status transitions, cancellation + deposit refund.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !canAdminister(role)) return NextResponse.json({ error: "Staff access required." }, { status: 403 });

  let action: string;
  try {
    const parsed = ActionSchema.parse(await req.json());
    action = parsed.action;
  } catch {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  try {
    const booking = await prisma.booking.findUnique({ where: { id: params.id } });
    if (!booking) return NextResponse.json({ error: "Not found." }, { status: 404 });

    if (action === "refund_deposit") {
      // Single release, only after the hire completes. Repeat calls return
      // the original refund instead of creating duplicates; real money
      // movement happens in Stripe (recorded status here for demo ledger).
      if (booking.status !== "completed") {
        return NextResponse.json({ error: `Deposit can only be released from completed hires (booking is ${booking.status}).` }, { status: 422 });
      }
      const prior = await prisma.refund.findFirst({ where: { bookingId: booking.id } });
      if (prior) return NextResponse.json({ ok: true, deduped: true, refundId: prior.id });
      await prisma.refund.create({ data: { bookingId: booking.id, amountPence: booking.securityDepositPence, reason: "Security deposit released after inspection", actor: session.user?.email ?? role, status: "recorded" } });
      await prisma.auditLog.create({ data: { action: "refund_deposit", resource: "booking", resourceId: booking.id, detail: `Deposit ${booking.securityDepositPence}p released by ${session.user?.email ?? role}` } });
      return NextResponse.json({ ok: true });
    }

    const from = booking.status as never;
    const to = action as never;
    try {
      assertTransition(from, to);
    } catch {
      return NextResponse.json({ error: `Invalid transition: ${from} → ${to}.` }, { status: 422 });
    }

    // Read-then-write INSIDE the transaction so concurrent PATCHes cannot
    // lost-update (e.g. confirmed→ready vs confirmed→cancelled).
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.booking.findUnique({ where: { id: booking.id } });
      if (!fresh) throw new Error("NOT_FOUND");
      assertTransition(fresh.status as never, to);
      await tx.booking.update({ where: { id: booking.id }, data: { status: action, ...(action === "cancelled" ? { cancelledAt: new Date(), cancelReason: `Cancelled by ${role} (${session.user?.email ?? "staff"})` } : {}) } });
      await tx.bookingStatusHistory.create({ data: { bookingId: booking.id, from: fresh.status, to: action, actor: role, note: `Admin action by ${session.user?.email ?? role}` } });
      await tx.auditLog.create({ data: { action: `booking:${action}`, resource: "booking", resourceId: booking.id, detail: `${fresh.status} → ${action} by ${session.user?.email ?? role}` } });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (e instanceof Error && e.message.startsWith("Invalid booking transition")) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    console.error("[admin booking]", e);
    return NextResponse.json({ error: "Action failed." }, { status: 500 });
  }
}
