import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { gateMutation } from "@/lib/security";
import { logger } from "@/lib/logger";
import { createPaymentIntent } from "@/features/payments/provider";

const Body = z
  .object({
    reference: z.string().min(3).max(24),
    email: z.string().email().max(254),
    // amount must equal the deposit due or the full total — never arbitrary.
    amountPence: z.number().int().positive().max(10_000_000),
    idempotencyKey: z.string().min(8).max(64),
  })
  .strict();

// POST /api/payments — initiate online payment for a reservation.
// Verifies amount against the ledger (deposit or total), then creates a
// provider intent (Stripe when configured, demo ledger otherwise).
export async function POST(req: Request) {
  const denied = gateMutation(req, "payments:init", 10, 60_000);
  if (denied) return denied;
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Reference, email, amount and idempotency key are required." }, { status: 400 });
  }
  try {
    const b = await prisma.booking.findUnique({ where: { reference: body.reference.trim().toUpperCase() } });
    if (!b || (b.guestEmail ?? "").toLowerCase() !== body.email.toLowerCase()) {
      return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
    }
    if (!["awaiting_payment", "payment_review", "held"].includes(b.status)) {
      return NextResponse.json({ error: `This reservation is ${b.status} — payment is settled at the depot counter.` }, { status: 409 });
    }
    if (body.amountPence !== b.depositDuePence && body.amountPence !== b.totalPence) {
      return NextResponse.json({ error: "Amount must equal the deposit due or the full total." }, { status: 422 });
    }
    const intent = await createPaymentIntent({
      bookingId: b.id,
      amountPence: body.amountPence,
      idempotencyKey: body.idempotencyKey.trim().slice(0, 64),
    });
    logger.info("[payments] intent created", { provider: intent.provider });
    return NextResponse.json(
      { ok: true, provider: intent.provider, paymentId: intent.paymentId, clientSecret: intent.clientSecret ?? null, demo: intent.demo ?? false },
      { status: 201 }
    );
  } catch (e) {
    logger.error("[payments] init failed");
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 500 });
  }
}
