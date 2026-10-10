import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/webhooks/stripe — signed, idempotent webhook processing.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  if (!process.env.STRIPE_SECRET_KEY) {
    // No Stripe configured — do NOT acknowledge as healthy; surface the
    // misconfiguration so the dashboard/ops notices instead of assuming OK.
    return NextResponse.json({ received: false, mode: "demo_no_stripe_configured" }, { status: 503 });
  }
  if (!secret || !sig) return NextResponse.json({ error: "Missing webhook signature." }, { status: 400 });

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const event = stripe.webhooks.constructEvent(raw, sig, secret);

    if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as { id: string; metadata?: { bookingId?: string } };
      const succeeded = event.type === "payment_intent.succeeded";
      const existing = await prisma.payment.findFirst({ where: { providerRef: intent.id } });
      if (existing && existing.status === "succeeded" && succeeded) {
        return NextResponse.json({ received: true, deduped: true }); // idempotent retry
      }
      if (existing) {
        await prisma.payment.update({ where: { id: existing.id }, data: { status: succeeded ? "succeeded" : "failed", rawPayload: raw.slice(0, 8000) } });
        const booking = await prisma.booking.findUnique({ where: { id: existing.bookingId } });
        if (booking) {
          if (succeeded && (booking.status === "awaiting_payment" || booking.status === "payment_review")) {
            await prisma.booking.update({ where: { id: booking.id }, data: { status: "awaiting_documents" } });
            await prisma.bookingStatusHistory.create({
              data: { bookingId: booking.id, from: booking.status, to: "awaiting_documents", actor: "system", note: `Stripe ${intent.id} succeeded` },
            }).catch(() => {});
          } else if (!succeeded && booking.status === "awaiting_payment") {
            await prisma.booking.update({ where: { id: booking.id }, data: { status: "payment_review" } });
            await prisma.bookingStatusHistory.create({
              data: { bookingId: booking.id, from: booking.status, to: "payment_review", actor: "system", note: `Stripe ${intent.id} failed` },
            }).catch(() => {});
          }
        }
      }
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[stripe-webhook]", e);
    return NextResponse.json({ error: "Webhook verification failed." }, { status: 400 });
  }
}
