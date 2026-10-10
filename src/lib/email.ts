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
  // Strip CRLF to block email header injection; cap subject length.
  const safeSubject = opts.subject.replace(/[\r\n]+/g, " ").slice(0, 200);
  // Never persist one-time codes — store a redacted placeholder instead.
  const safeBody =
    opts.kind === "handover_otp" ? "Handover code sent (redacted for security)." : opts.body;
  const record = await prisma.notification.create({
    data: {
      bookingId: opts.bookingId,
      kind: opts.kind,
      to: opts.to,
      subject: safeSubject,
      body: safeBody,
      status: "queued",
    },
  });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Redact PII: log kind + recipient domain only, never the full address.
    const domain = opts.to.split("@")[1] ?? "invalid";
    console.log(`[notify:demo] ${opts.kind} → @${domain}`);
    await prisma.notification.update({ where: { id: record.id }, data: { status: "logged_demo" } });
    return { id: record.id, delivered: false };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "bookings@wattleandwander.com.au",
      to: opts.to,
      subject: safeSubject,
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
    confirmation: `Your Wattle & Wander collection voucher ${ref} (${caravan}, ${pickup} → ${ret}, total ${total} incl. GST) is reserved. No payment is taken online — show this reference at Brunswick Depot, bring your driving licence and tow-vehicle documents, and arrive 15 minutes early. Our team checks everything with you at the counter and settles payment there.`,
    paymentReceipt: `Payment received for reservation ${ref}. Thank you — your receipt is attached to your account.`,
    collectionReminder: `Reminder: collect ${caravan} for booking ${ref}. Bring your driving licence, tow-vehicle documents, and arrive 15 minutes early for the handover.`,
    documentRequest: `Booking ${ref}: please bring your driving licence and tow-vehicle documents to the depot counter — our team checks them with you at handover.`,
  };
}
