// Payment provider adapter. Stripe test mode when keys are set,
// otherwise an unmistakably-labelled DEMO mode for local development.
// Booking status only advances on trusted server-side verification.

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
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    const { prisma } = await import("@/lib/db");
    const existing = await prisma.payment.findUnique({ where: { idempotencyKey: opts.idempotencyKey } }).catch(() => null);
    if (existing) return { provider: "demo", paymentId: existing.id, amountPence: existing.amountPence, demo: true };
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
  }
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(secret);
  const intent = await stripe.paymentIntents.create(
    {
      amount: opts.amountPence,
      currency: "gbp",
      metadata: { bookingId: opts.bookingId },
    },
    { idempotencyKey: opts.idempotencyKey }
  );
  const { prisma } = await import("@/lib/db");
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
  return { provider: "stripe", clientSecret: intent.client_secret ?? undefined, paymentId: intent.id, amountPence: opts.amountPence };
}

export async function confirmDemoPayment(paymentId: string, succeed: boolean): Promise<void> {
  const { prisma } = await import("@/lib/db");
  const payment = await prisma.payment.findFirst({ where: { id: paymentId }, include: { booking: true } });
  if (!payment) throw new Error("Payment not found");
  await prisma.payment.update({ where: { id: payment.id }, data: { status: succeed ? "succeeded" : "failed" } });
  if (succeed) {
    const { assertTransition } = await import("@/features/bookings/stateMachine");
    const current = payment.booking.status as never;
    try {
      assertTransition(current as never, "awaiting_documents" as never);
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: "awaiting_documents" },
      });
      await prisma.bookingStatusHistory.create({
        data: { bookingId: payment.bookingId, from: payment.booking.status, to: "awaiting_documents", actor: "system", note: "Demo payment verified server-side" },
      });
    } catch {
      // Already past this state — idempotent, do nothing.
    }
  }
}
