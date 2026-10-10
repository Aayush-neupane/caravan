import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gateMutation } from "@/lib/security";

const Body = z.object({ published: z.boolean() }).strict();

// PATCH /api/admin/reviews/:id — publish/unpublish a customer review.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const denied = gateMutation(req, "admin:reviews", 60, 60_000);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !can("bookings:write", role)) return NextResponse.json({ error: "Staff access required." }, { status: 403 });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const row = await prisma.review.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  await prisma.review.update({ where: { id: row.id }, data: { published: body.published } });
  await prisma.auditLog.create({
    data: { action: body.published ? "reviews:publish" : "reviews:unpublish", resource: "review", resourceId: row.id, detail: `by ${session.user?.email ?? role}` },
  });
  return NextResponse.json({ ok: true });
}
