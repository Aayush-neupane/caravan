// Payment provider adapter. Stripe test mode when keys are set,
// otherwise an unmistakably-labelled DEMO mode for local development.
// Booking status only advances on trusted server-side verification.

import { z } from "zod";

export type PaymentIntent = {
  provider: "stripe" | "demo";
  clientSecret?: string;
  paymentId: string;
  amountPence: number;
  demo?: boolean;
};

export async function createPaymentIntent(opts: {
  bookingId: string;
  amountPence: number;
  idempotencyKey: string;
}): Promise<PaymentIntent> {
  z.number().int().positive().max(10_000_000).parse(opts.amountPence);
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    const { prisma } = await import("@/lib/db");
    const existing = await prisma.payment.findUnique({ where: { idempotencyKey: opts.idempotencyKey } }).catch(() => null);
    if (existing) return { provider: "demo", paymentId: existing.id, amountPence: existing.amountPence, demo: true };
    try {
      const payment = await prisma.payment.create({
        data: {
          bookingId: opts.bookingId,
          provider: "demo",
          amountPence: opts.amountPence,
          status: "pending",
          idempotencyKey: opts.idempotencyKey,
        },
      });
      return { provider: "demo", paymentId: payment.id, amountPence: opts.amountPence, demo: true };
    } catch (e) {
      // TOCTOU: concurrent creators with the same key — return the winner.
      if ((e as { code?: string })?.code === "P2002") {
        const winner = await prisma.payment.findUnique({ where: { idempotencyKey: opts.idempotencyKey } });
        if (winner) return { provider: "demo", paymentId: winner.id, amountPence: winner.amountPence, demo: true };
      }
      throw e;
    }
  }
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(secret, { apiVersion: "2024-06-20" });
  const intent = await stripe.paymentIntents.create(
    {
      amount: opts.amountPence,
      currency: "aud",
      metadata: { bookingId: opts.bookingId },
    },
    { idempotencyKey: opts.idempotencyKey }
  );
  const { prisma } = await import("@/lib/db");
  try {
    await prisma.payment.create({
      data: {
        bookingId: opts.bookingId,
        provider: "stripe",
        providerRef: intent.id,
        amountPence: opts.amountPence,
        status: "pending",
        idempotencyKey: opts.idempotencyKey,
      },
    });
  } catch (e) {
    // Same TOCTOU guard for the Stripe branch (idempotencyKey/providerRef unique).
    if ((e as { code?: string })?.code !== "P2002") throw e;
    const winner = await prisma.payment.findUnique({ where: { idempotencyKey: opts.idempotencyKey } });
    if (winner) return { provider: "stripe", clientSecret: intent.client_secret ?? undefined, paymentId: winner.id, amountPence: winner.amountPence };
    throw e;
  }
  return { provider: "stripe", clientSecret: intent.client_secret ?? undefined, paymentId: intent.id, amountPence: opts.amountPence };
}

// DEMO-ONLY: must never be wired to an authed route in production without a
// role check (staff-gated). Guarded server-side: throws when Stripe is
// configured (i.e. not in demo mode).
export async function confirmDemoPayment(paymentId: string, succeed: boolean): Promise<void> {
  if (process.env.STRIPE_SECRET_KEY) {
    throw new Error("Demo payment confirmation is disabled when Stripe is configured.");
  }
  const { prisma } = await import("@/lib/db");
  const payment = await prisma.payment.findFirst({ where: { id: paymentId }, include: { booking: true } });
  if (!payment) throw new Error("Payment not found");
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: payment.id }, data: { status: succeed ? "succeeded" : "failed" } });
    if (!succeed) return;
    const { assertTransition } = await import("@/features/bookings/stateMachine");
    const current = payment.booking.status as never;
    try {
      assertTransition(current as never, "awaiting_documents" as never);
    } catch {
      // Idempotent only when already past this state; otherwise surface.
      const fresh = await tx.booking.findUnique({ where: { id: payment.bookingId } });
      if (fresh && (fresh.status === "awaiting_documents" || fresh.status === "confirmed")) return;
      throw new Error(`Invalid booking transition: ${current} → awaiting_documents`);
    }
    await tx.booking.update({
      where: { id: payment.bookingId },
      data: { status: "awaiting_documents" },
    });
    await tx.bookingStatusHistory.create({
      data: { bookingId: payment.bookingId, from: payment.booking.status, to: "awaiting_documents", actor: "system", note: "Demo payment verified server-side" },
    });
  });
}
