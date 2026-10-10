import { NextResponse } from "next/server";
import { z } from "zod";
import { cleanText, gateMutation } from "@/lib/security";
import { logger } from "@/lib/logger";
import { sendNotification } from "@/lib/email";

const Body = z.object({
  name: cleanText(2, 80),
  email: z.string().email().max(254),
  topic: cleanText(1, 60).default("General"),
  message: cleanText(10, 2000),
});

export async function POST(req: Request) {
  const denied = gateMutation(req, "contact:post", 5, 60_000);
  if (denied) return denied;
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Please give your name, a valid email, and a message of at least 10 characters." }, { status: 400 });
  }
  try {
    // Strip CRLF from header-adjacent fields to block header injection.
    const safeTopic = body.topic.replace(/[\r\n]+/g, " ").slice(0, 60);
    const safeName = body.name.replace(/[\r\n]+/g, " ").slice(0, 80);
    // Logged to Notification AND emailed to the depot when Resend is set.
    await sendNotification({
      kind: "contact",
      to: "hello@wattleandwander.com.au",
      subject: `[${safeTopic}] ${safeName}`,
      body: `${body.name} <${body.email}>\n\n${body.message}`,
    });
    // Intentionally no PII in logs (name/email stay in the DB row only).
    logger.info("[contact] received", { topic_len: safeTopic.length, len: body.message.length });
    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.error("[contact] failed");
    return NextResponse.json({ error: "Could not send. Please email hello@wattleandwander.com.au directly." }, { status: 500 });
  }
}
