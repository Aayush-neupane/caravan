import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

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
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
    const event = stripe.webhooks.constructEvent(raw, sig, secret);

    if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as { id: string; metadata?: { bookingId?: string }; amount?: number; amount_received?: number };
      const succeeded = event.type === "payment_intent.succeeded";
      const received = intent.amount_received ?? intent.amount ?? 0;
      const existing = await prisma.payment.findUnique({ where: { providerRef: intent.id } });
      if (!existing) {
        logger.warn("[stripe-webhook] unknown intent", { intent: intent.id.slice(0, 24) });
        return NextResponse.json({ received: true, unknown: true });
      }
      // Idempotent + immutable: a succeeded payment is never overwritten
      // (e.g. a late failure event must not flip money back to failed).
      if (existing.status === "succeeded") {
        return NextResponse.json({ received: true, deduped: true }); // idempotent retry
      }
      const booking = await prisma.booking.findUnique({ where: { id: existing.bookingId } });
      if (!booking) {
        logger.warn("[stripe-webhook] booking not found", { intent: intent.id.slice(0, 24) });
        return NextResponse.json({ error: "Unknown booking." }, { status: 400 });
      }
      // Amount verification: Stripe must agree with our ledger (total or
      // deposit). Mismatch → audit + refuse to advance (no silent credit).
      if (received !== booking.totalPence && received !== booking.depositDuePence) {
        try {
          await prisma.auditLog.create({
            data: { action: "payment:amount_mismatch", resource: "payment", resourceId: existing.id, detail: `Intent ${intent.id} amount ${received} vs booking total ${booking.totalPence}/deposit ${booking.depositDuePence}` },
          });
        } catch (logErr) {
          logger.error("[stripe-webhook] audit log failed");
        }
        return NextResponse.json({ error: "Amount mismatch." }, { status: 400 });
      }
      const rawPayload = JSON.stringify({ id: intent.id, amount: received, event: event.type }).slice(0, 8000) + "…(truncated to id+amount)";
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({ where: { id: existing.id }, data: { status: succeeded ? "succeeded" : "failed", rawPayload } });
        if (succeeded && (booking.status === "awaiting_payment" || booking.status === "payment_review")) {
          await tx.booking.update({ where: { id: booking.id }, data: { status: "awaiting_documents" } });
          await tx.bookingStatusHistory.create({
            data: { bookingId: booking.id, from: booking.status, to: "awaiting_documents", actor: "system", note: `Stripe ${intent.id} succeeded` },
          });
          await tx.auditLog.create({
            data: { action: "payment:succeeded", resource: "payment", resourceId: existing.id, detail: `Stripe ${intent.id} succeeded (${received}p)` },
          });
        } else if (!succeeded && booking.status === "awaiting_payment") {
          await tx.booking.update({ where: { id: booking.id }, data: { status: "payment_review" } });
          await tx.bookingStatusHistory.create({
            data: { bookingId: booking.id, from: booking.status, to: "payment_review", actor: "system", note: `Stripe ${intent.id} failed` },
          });
          await tx.auditLog.create({
            data: { action: "payment:failed", resource: "payment", resourceId: existing.id, detail: `Stripe ${intent.id} failed` },
          });
        } else {
          await tx.auditLog.create({
            data: { action: succeeded ? "payment:succeeded_noop" : "payment:failed_noop", resource: "payment", resourceId: existing.id, detail: `Stripe ${intent.id} ignored for booking status ${booking.status}` },
          });
        }
      });
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    logger.error("[stripe-webhook] verification failed");
    return NextResponse.json({ error: "Webhook verification failed." }, { status: 400 });
  }
}
