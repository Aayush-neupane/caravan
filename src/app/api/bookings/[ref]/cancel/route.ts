import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { gateMutation } from "@/lib/security";
import { logger } from "@/lib/logger";
import { canTransition } from "@/features/bookings/stateMachine";
import { cancellationBand, cancellationRefundPence, daysBeforePickup } from "@/features/bookings/cancellation";

const Body = z
  .object({
    email: z.string().email().max(254).optional(),
    phone: z.string().max(30).optional(),
    name: z.string().max(80).optional(),
    reason: z
      .string()
      .max(500)
      .regex(/^[^<>]*$/, "Angle brackets are not allowed.")
      .optional(),
  })
  .strict();

// POST /api/bookings/[ref]/cancel — guest self-service cancellation.
// Identity: reference + ONE matching identifier (same rule as lookup).
// held / awaiting_* → cancelled directly (nothing paid online).
// confirmed / ready → cancel_requested for staff resolution (vehicle may be
// prepped). Tiered refund is recorded when amount > 0.
export async function POST(req: Request, { params }: { params: { ref: string } }) {
  const denied = gateMutation(req, "bookings:cancel", 10, 60_000);
  if (denied) return denied;
  const ref = (params.ref ?? "").trim().toUpperCase();
  if (!ref) return NextResponse.json({ error: "Booking reference required." }, { status: 400 });
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Provide email, phone or name with your reference." }, { status: 400 });
  }
  const digits = (s: string) => s.replace(/\D/g, "");
  try {
    const b = await prisma.booking.findUnique({ where: { reference: ref } });
    if (!b) return NextResponse.json({ bookings: [] });
    const match =
      (!!body.email && (b.guestEmail ?? "").toLowerCase() === body.email.toLowerCase()) ||
      (!!body.phone && !!b.guestPhone && digits(b.guestPhone) === digits(body.phone) && digits(body.phone) !== "") ||
      (!!body.name && (b.guestName ?? "").toLowerCase() === body.name.toLowerCase());
    if (!match) return NextResponse.json({ bookings: [] });

    const days = daysBeforePickup(new Date(b.pickupDate));
    const refundPence = cancellationRefundPence(b.totalPence, days);
    const band = cancellationBand(days);

    // Direct-cancel states vs staff-resolution states.
    const direct = ["held", "awaiting_payment", "awaiting_documents", "payment_review"].includes(b.status);
    const to = direct ? "cancelled" : b.status === "cancel_requested" ? "cancel_requested" : "cancel_requested";
    if (b.status === "cancelled" || b.status === "completed" || b.status === "expired") {
      return NextResponse.json({ error: `This reservation is already ${b.status}.` }, { status: 409 });
    }
    if (direct && !canTransition(b.status as never, "cancelled" as never)) {
      return NextResponse.json({ error: "This reservation cannot be cancelled online." }, { status: 409 });
    }
    if (!direct && !canTransition(b.status as never, "cancel_requested" as never)) {
      return NextResponse.json({ error: "This reservation cannot be cancelled online. Please call the depot." }, { status: 409 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: b.id },
        data: { status: to, cancelledAt: new Date(), cancelReason: body.reason?.slice(0, 500) ?? `Guest cancelled (${band}, ${days}d before pickup)` },
      });
      await tx.bookingStatusHistory.create({
        data: { bookingId: b.id, from: b.status, to, actor: "customer", note: `Guest self-cancel (${band})` },
      });
      if (refundPence > 0) {
        await tx.refund.create({
          data: {
            bookingId: b.id,
            amountPence: refundPence,
            reason: `Guest cancel ${days}d before pickup — ${band} per policy v2026.1`,
            status: "recorded",
            actor: "system",
          },
        });
      }
      await tx.auditLog.create({
        data: { action: "booking:guest_cancel", resource: "booking", resourceId: b.id, detail: `${ref} ${b.status} → ${to} (${band}, refund ${refundPence}p)` },
      });
    });

    logger.info("[bookings] guest cancel", { ref, to, band });
    return NextResponse.json({ ok: true, status: to, refundPence, band, daysBeforePickup: days });
  } catch (e) {
    logger.error("[bookings] guest cancel failed");
    return NextResponse.json({ error: "Could not cancel. Please call +61 3 9123 4567." }, { status: 500 });
  }
}
