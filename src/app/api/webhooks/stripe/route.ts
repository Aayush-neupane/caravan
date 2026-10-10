import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/webhooks/stripe — signed, idempotent webhook processing.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ received: true, mode: "demo_no_stripe_configured" });
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
      if (existing && existing.status === "succeeded") {
        return NextResponse.json({ received: true, deduped: true }); // idempotent retry
      }
      if (existing) {
        await prisma.payment.update({ where: { id: existing.id }, data: { status: succeeded ? "succeeded" : "failed", rawPayload: JSON.stringify(event.type) } });
        if (succeeded) {
          await prisma.booking.updateMany({ where: { id: existing.bookingId, status: "awaiting_payment" }, data: { status: "awaiting_documents" } });
        }
      }
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[stripe-webhook]", e);
    return NextResponse.json({ error: "Webhook verification failed." }, { status: 400 });
  }
}
