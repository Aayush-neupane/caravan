import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const Body = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  topic: z.string().max(60).default("General"),
  message: z.string().min(10).max(2000),
});

export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Please give your name, a valid email, and a message of at least 10 characters." }, { status: 400 });
  }
  try {
    await prisma.notification.create({
      data: { kind: "contact", to: "stay@hartleyandmoor.co.uk", subject: `[${body.topic}] ${body.name}`, body: `${body.name} <${body.email}>\n\n${body.message}`, status: "logged_demo" },
    });
    console.log(`[contact] ${body.topic} from ${body.name} <${body.email}>`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[contact]", e);
    return NextResponse.json({ error: "Could not send. Please email stay@hartleyandmoor.co.uk directly." }, { status: 500 });
  }
}
