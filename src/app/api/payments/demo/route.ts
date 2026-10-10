import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createPaymentIntent, confirmDemoPayment } from "@/features/payments/provider";
import { sendNotification } from "@/lib/email";

// POST /api/payments/demo — create + confirm a labelled DEMO payment.
// Disabled when live Stripe keys are configured (prevents zero-money
// confirmations in production).
const Body = z.object({
  bookingId: z.string().min(1),
  succeed: z.boolean().default(true),
}).strict();

export async function POST(req: Request) {
  if (process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Demo payments are disabled when Stripe is configured." }, { status: 403 });
  }
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid payment request." }, { status: 400 });
  }
  try {
    const booking = await prisma.booking.findUnique({ where: { id: body.bookingId } });
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    if (!["awaiting_payment", "payment_review"].includes(booking.status)) {
      return NextResponse.json({ error: `Booking is ${booking.status}; payment cannot be taken in this state.`, demo: true }, { status: 422 });
    }
    const intent = await createPaymentIntent({
      bookingId: booking.id,
      amountPence: booking.depositDuePence,
      idempotencyKey: `demo-${booking.id}-${booking.depositDuePence}`,
    });
    if (!body.succeed) {
      await prisma.payment.updateMany({ where: { bookingId: booking.id, status: "pending" }, data: { status: "failed" } });
      await prisma.booking.update({ where: { id: booking.id }, data: { status: "payment_review" } });
      await prisma.bookingStatusHistory.create({
        data: { bookingId: booking.id, from: booking.status, to: "payment_review", actor: "system", note: "Demo payment declined (as requested)" },
      }).catch(() => {});
      return NextResponse.json({ ok: false, demo: true, message: "Demo payment declined (as requested). Your hold is retained for 20 minutes — try again or choose another method." });
    }
    await confirmDemoPayment(intent.paymentId, true);
    await sendNotification({ bookingId: booking.id, kind: "payment_receipt", to: booking.guestEmail ?? "guest", subject: `Payment received — ${booking.reference}`, body: `Deposit ${booking.depositDuePence}p received (DEMO, no real charge). Next: upload your driving licence to your account.` }).catch(() => {});
    const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
    return NextResponse.json({ ok: true, demo: true, status: updated?.status, reference: booking.reference, message: "DEMO payment confirmed — no real money moved." });
  } catch (e) {
    console.error("[demo-pay]", e);
    return NextResponse.json({ error: "Demo payment failed." }, { status: 500 });
  }
}
