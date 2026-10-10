import { prisma } from "./db";

// Transactional email via Resend when configured; otherwise logged.
// Every send is recorded in Notification for delivery tracking; failed rows
// are surfaced in the admin notifications queue for manual resend (no
// background worker — booking/payment success never depends on email).

export async function sendNotification(opts: {
  bookingId?: string;
  kind: string;
  to: string;
  subject: string;
  body: string;
}): Promise<{ id: string; delivered: boolean }> {
  const record = await prisma.notification.create({
    data: {
      bookingId: opts.bookingId,
      kind: opts.kind,
      to: opts.to,
      subject: opts.subject,
      body: opts.body,
      status: "queued",
    },
  });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[notify:demo] ${opts.kind} → ${opts.to}: ${opts.subject}`);
    await prisma.notification.update({ where: { id: record.id }, data: { status: "logged_demo" } });
    return { id: record.id, delivered: false };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "bookings@hartleyandmoor.example",
      to: opts.to,
      subject: opts.subject,
      text: opts.body,
    });
    await prisma.notification.update({ where: { id: record.id }, data: { status: "sent" } });
    return { id: record.id, delivered: true };
  } catch (err) {
    console.error("[notify:error]", err);
    await prisma.notification.update({ where: { id: record.id }, data: { status: "failed" } });
    return { id: record.id, delivered: false };
  }
}

export function bookingEmailBodies(ref: string, caravan: string, pickup: string, ret: string, total: string) {
  return {
    confirmation: `Your Hartley & Moor collection voucher ${ref} (${caravan}, ${pickup} → ${ret}, total ${total} incl. VAT) is reserved. No payment is taken online — show this reference at Lansdown Depot, bring your driving licence and tow-car documents, and arrive 15 minutes early. Our team checks everything with you at the counter and settles payment there.`,
    paymentReceipt: `Payment received for reservation ${ref}. Thank you — your receipt is attached to your account.`,
    collectionReminder: `Reminder: collect ${caravan} for booking ${ref}. Bring your driving licence, tow-car documents, and arrive 15 minutes early for the handover.`,
    documentRequest: `Booking ${ref}: please bring your driving licence and tow-car documents to the depot counter — our team checks them with you at handover.`,
  };
}
