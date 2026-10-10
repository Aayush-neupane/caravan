import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gateMutation } from "@/lib/security";
import { rateLimit } from "@/lib/rateLimit";
import { sendNotification } from "@/lib/email";
import { assertTransition } from "@/features/bookings/stateMachine";
import { OTP_SEND_MAX, OTP_TRY_MAX, OTP_WINDOW_MS, otpFor, otpSlot, verifyOtp } from "@/features/handover/otp";

const Body = z.object({
  step: z.enum(["send", "verify"]),
  code: z.string().max(16).optional(),
}).strict();

// POST /api/admin/bookings/:id/otp — depot-counter guest proof.
// send: emails a 10-minute code to the guest's inbox (proves presence).
// verify: checks the code the guest reads out, then hands off (held→active).
// No keys move without a verified code.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const denied = gateMutation(req, "admin:bookings", 60, 60_000);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !can("bookings:write", role)) return NextResponse.json({ error: "Staff access required." }, { status: 403 });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!booking) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (booking.status !== "held") {
    return NextResponse.json({ error: `Handover codes are for held reservations (this is ${booking.status}).` }, { status: 422 });
  }
  const actor = session.user?.email ?? role ?? "staff";
  const actorId = (session.user as { id?: string })?.id ?? undefined;

  if (body.step === "send") {
    const budget = rateLimit(`handover:send:${booking.id}`, OTP_SEND_MAX, OTP_WINDOW_MS);
    if (!budget.ok) {
      return NextResponse.json({ error: `Code already sent — ask the guest to check their inbox (retry in ${budget.retryAfterSec}s).` }, { status: 429, headers: { "retry-after": String(budget.retryAfterSec) } });
    }
    if (!booking.guestEmail) return NextResponse.json({ error: "No guest email on this reservation." }, { status: 422 });
    const code = otpFor(booking.id, otpSlot());
    await sendNotification({
      bookingId: booking.id,
      kind: "handover_otp",
      to: booking.guestEmail,
      subject: `Your handover code ${booking.reference}`,
      body: `Show this code to our team at the depot counter to collect ${booking.reference}: ${code}. It expires in 10 minutes. Never share it by phone — only read it to our staff in person.`,
    }).catch(() => {});
    await prisma.auditLog.create({
      data: { action: "handover:otp_sent", resource: "booking", resourceId: booking.id, detail: `Code emailed to guest inbox by ${actor}`, actorId },
    });
    // Demo/log mail mode has no inbox to check: surface the code to staff so
    // the flow stays testable. Fail closed in production — never return the
    // code when Resend is configured OR when running in production.
    const demo = !process.env.RESEND_API_KEY && process.env.NODE_ENV !== "production";
    return NextResponse.json({ ok: true, ...(demo ? { demoCode: code, demo: true } : {}) });
  }

  const tries = rateLimit(`handover:try:${booking.id}`, OTP_TRY_MAX, OTP_WINDOW_MS);
  if (!tries.ok) {
    return NextResponse.json({ error: "Too many wrong codes — send a fresh one and try again." }, { status: 429, headers: { "retry-after": String(tries.retryAfterSec) } });
  }
  if (!verifyOtp(booking.id, body.code)) {
    await prisma.auditLog.create({
      data: { action: "handover:otp_failed", resource: "booking", resourceId: booking.id, detail: `Wrong handover code entered by ${actor}`, actorId },
    });
    return NextResponse.json({ error: "That code does not match. Check with the guest and try again." }, { status: 422 });
  }

  // Verified guest + logged paperwork, or no handoff.
  const logged = await prisma.customerDocument.count({ where: { bookingId: booking.id, status: "approved" } });
  if (logged === 0) {
    return NextResponse.json({ error: "Log the received documents first (Documents → log physical receipt)." }, { status: 422 });
  }
  try {
    assertTransition(booking.status as never, "active" as never);
  } catch {
    return NextResponse.json({ error: `Cannot hand off from ${booking.status}.` }, { status: 409 });
  }
  try {
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.booking.findUnique({ where: { id: booking.id } });
      if (!fresh) throw new Error("NOT_FOUND");
      assertTransition(fresh.status as never, "active" as never);
      await tx.booking.update({ where: { id: booking.id }, data: { status: "active" } });
      await tx.bookingStatusHistory.create({
        data: { bookingId: booking.id, from: fresh.status, to: "active", actor, note: `OTP-verified handover by ${actor}` },
      });
      await tx.auditLog.create({
        data: { action: "handover:verified", resource: "booking", resourceId: booking.id, detail: `Guest OTP verified; caravan handed off by ${actor}`, actorId },
      });
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "NOT_FOUND") return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ error: "Booking state changed during handover — refresh and try again." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
