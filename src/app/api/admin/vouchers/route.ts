import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gateMutation, isCalendarDate } from "@/lib/security";

const CODE_RE = /^[A-Z0-9-]{4,32}$/;
const MAX_INITIAL_PENCE = 500_000; // $5,000 ceiling per voucher

const CreateBody = z
  .object({
    code: z.string().min(4).max(32),
    initialPence: z.number().int().min(100).max(MAX_INITIAL_PENCE),
    expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  })
  .strict();

// Vouchers are ledger money: issuing one creates claimable credit, so the
// action is gated by refunds:write (owner/admin) exactly like spending,
// disabling or refunding one. Balances are only ever debited by a real
// booking redemption — never edited here.
function moneySession(req: Request) {
  return gateMutation(req, "admin:vouchers", 60, 60_000);
}

// GET /api/admin/vouchers — list codes + balances (staff only).
export async function GET(req: Request) {
  const denied = moneySession(req);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !can("refunds:write", role)) {
    return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  }
  const rows = await prisma.voucher.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json({
    vouchers: rows.map((v) => ({
      code: v.code,
      balancePence: v.balancePence,
      initialPence: v.initialPence,
      active: v.active,
      expiresAt: v.expiresAt ? v.expiresAt.toISOString().slice(0, 10) : null,
    })),
  });
}

// POST /api/admin/vouchers — issue a gift voucher. Live on the next quote.
export async function POST(req: Request) {
  const denied = moneySession(req);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !can("refunds:write", role)) {
    return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  }

  let body: z.infer<typeof CreateBody>;
  try {
    body = CreateBody.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Code (4–32 chars: A–Z, 0–9 and hyphens) and an initial value of $1–$5,000 are required." }, { status: 400 });
  }

  const code = body.code.trim().toUpperCase();
  if (!CODE_RE.test(code)) {
    return NextResponse.json({ error: "Codes are 4–32 characters: capital letters, numbers and hyphens only." }, { status: 422 });
  }
  if (body.expiresAt && !isCalendarDate(body.expiresAt)) {
    return NextResponse.json({ error: "Expiry must be a real calendar date (YYYY-MM-DD)." }, { status: 422 });
  }

  const dupe = await prisma.voucher.findUnique({ where: { code } });
  if (dupe) return NextResponse.json({ error: `Code ${code} already exists.` }, { status: 409 });

  const created = await prisma.$transaction(async (tx) => {
    const voucher = await tx.voucher.create({
      data: {
        code,
        initialPence: body.initialPence,
        balancePence: body.initialPence,
        expiresAt: body.expiresAt ? new Date(`${body.expiresAt}T23:59:59Z`) : null,
        active: true,
      },
    });
    await tx.auditLog.create({
      data: {
        action: "vouchers:create", resource: "voucher", resourceId: voucher.id,
        detail: `${code} $${(body.initialPence / 100).toFixed(2)} issued by ${session.user?.email ?? role}`,
        actorId: (session.user as { id?: string })?.id ?? undefined,
      },
    });
    return voucher;
  });
  return NextResponse.json({ ok: true, code }, { status: 201 });
}
