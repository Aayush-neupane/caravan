import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gateMutation } from "@/lib/security";

const ROLES = ["owner", "admin", "booking_manager", "fleet_manager", "document_reviewer", "support", "analyst", "customer"] as const;

const Body = z.object({
  email: z.string().email(),
  role: z.enum(ROLES),
}).strict();

// PATCH /api/admin/staff — change a user's role. Owner-only, and never your
// own (no self-lockout footgun).
export async function PATCH(req: Request) {
  const denied = gateMutation(req, "admin:staff", 60, 60_000);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !can("staff:write", role)) return NextResponse.json({ error: "Owner required." }, { status: 403 });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Valid email and role required." }, { status: 400 });
  }
  if (body.email.toLowerCase() === (session.user?.email ?? "").toLowerCase()) {
    return NextResponse.json({ error: "You cannot change your own role." }, { status: 422 });
  }
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (user.role === body.role) return NextResponse.json({ ok: true, deduped: true });
  // Last-owner floor: demoting the final owner would orphan administration.
  if (user.role === "owner" && body.role !== "owner") {
    const owners = await prisma.user.count({ where: { role: "owner", id: { not: user.id } } });
    if (owners === 0) {
      return NextResponse.json({ error: "This is the last owner — promote someone else first." }, { status: 409 });
    }
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { role: body.role } }),
    prisma.auditLog.create({
      data: {
        action: "staff:role", resource: "user", resourceId: user.id,
        detail: `${user.email}: ${user.role} → ${body.role} by ${session.user?.email ?? role}`,
      },
    }),
  ]);
  return NextResponse.json({ ok: true });
}
