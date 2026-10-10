import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canAdminister } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertTransition } from "@/features/bookings/stateMachine";

// PATCH /api/admin/bookings/:id — controlled status transitions, cancellation + deposit refund.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !canAdminister(role)) return NextResponse.json({ error: "Staff access required." }, { status: 403 });

  let action: string;
  try {
    action = (await req.json()).action as string;
  } catch {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  try {
    const booking = await prisma.booking.findUnique({ where: { id: params.id } });
    if (!booking) return NextResponse.json({ error: "Not found." }, { status: 404 });

    if (action === "refund_deposit") {
      await prisma.refund.create({ data: { bookingId: booking.id, amountPence: booking.securityDepositPence, reason: "Security deposit released after inspection", actor: session.user?.email ?? role, status: "recorded" } });
      await prisma.auditLog.create({ data: { action: "refund_deposit", resource: "booking", resourceId: booking.id, detail: `Deposit ${booking.securityDepositPence}p released` } });
      return NextResponse.json({ ok: true });
    }

    const from = booking.status as never;
    const to = action as never;
    try {
      assertTransition(from, to);
    } catch {
      return NextResponse.json({ error: `Invalid transition: ${from} → ${to}.` }, { status: 422 });
    }

    await prisma.$transaction([
      prisma.booking.update({ where: { id: booking.id }, data: { status: action, ...(action === "cancelled" ? { cancelledAt: new Date(), cancelReason: `Cancelled by ${role}` } : {}) } }),
      prisma.bookingStatusHistory.create({ data: { bookingId: booking.id, from: booking.status, to: action, actor: role, note: "Admin action" } }),
      prisma.auditLog.create({ data: { action: `booking:${action}`, resource: "booking", resourceId: booking.id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin booking]", e);
    return NextResponse.json({ error: "Action failed." }, { status: 500 });
  }
}
