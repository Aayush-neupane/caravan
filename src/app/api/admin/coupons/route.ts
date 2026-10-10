import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gateMutation, isCalendarDate } from "@/lib/security";

const CreateBody = z.object({
  code: z.string().min(3).max(24).regex(/^[A-Z0-9-]+$/i, "Letters, numbers and hyphens only."),
  kind: z.enum(["percent", "fixed"]),
  value: z.number().int().min(1),
  minTotalPence: z.number().int().min(0).default(0),
  maxUses: z.number().int().min(1).max(100000).nullable().default(null),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  caravanSlug: z.string().min(1).max(80).nullable().default(null),
  active: z.boolean().default(true),
}).strict().refine(
  (b) => (b.kind === "percent" ? b.value >= 1 && b.value <= 60 : b.value >= 100),
  "Percent is 1–60; fixed is at least 100p (£1)."
);

// POST /api/admin/coupons — create a coupon. Live on the next quote.
export async function POST(req: Request) {
  const denied = gateMutation(req, "admin:coupons", 60, 60_000);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !can("coupons:write", role)) return NextResponse.json({ error: "Staff access required." }, { status: 403 });

  let body: z.infer<typeof CreateBody>;
  try {
    body = CreateBody.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Check code, kind, value (percent 1–60, fixed ≥100p), and dates." }, { status: 400 });
  }

  const code = body.code.trim().toUpperCase();
  const dupe = await prisma.coupon.findUnique({ where: { code } });
  if (dupe) return NextResponse.json({ error: `Code ${code} already exists.` }, { status: 409 });
  const caravanSlug = (body.caravanSlug ?? "").trim() || null;
  if (caravanSlug) {
    const van = await prisma.caravan.findUnique({ where: { slug: caravanSlug } });
    if (!van) return NextResponse.json({ error: "Restricted caravan slug not found." }, { status: 422 });
  }
  if (body.expiresAt && !isCalendarDate(body.expiresAt)) {
    return NextResponse.json({ error: "Expiry must be a real calendar date (YYYY-MM-DD)." }, { status: 422 });
  }

  const created = await prisma.coupon.create({
    data: {
      code,
      kind: body.kind,
      value: body.value,
      minTotalPence: body.minTotalPence,
      maxUses: body.maxUses,
      expiresAt: body.expiresAt ? new Date(`${body.expiresAt}T23:59:59Z`) : null,
      caravanId: caravanSlug,
      active: body.active,
    },
  });
  await prisma.auditLog.create({
    data: { action: "coupons:create", resource: "coupon", resourceId: created.id, detail: `${code} ${body.kind} ${body.value} by ${session.user?.email ?? role}` },
  });
  return NextResponse.json({ ok: true, code }, { status: 201 });
}
