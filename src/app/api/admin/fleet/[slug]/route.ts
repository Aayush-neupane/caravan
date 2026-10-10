import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gateMutation } from "@/lib/security";

const Body = z.object({ published: z.boolean() });

// PATCH /api/admin/fleet/:slug — publish / unpublish. Unpublishing never
// deletes history; response includes future-booking count as the warning.
export async function PATCH(req: Request, { params }: { params: { slug: string } }) {
  const denied = gateMutation(req, "admin:fleet", 60, 60_000);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !can("fleet:write", role)) {
    return NextResponse.json({ error: "Fleet manager role required." }, { status: 403 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const caravan = await prisma.caravan.findUnique({ where: { slug: params.slug } });
  if (!caravan) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const future = await prisma.booking.count({
    where: { caravanId: caravan.id, pickupDate: { gte: new Date() }, status: { notIn: ["cancelled", "expired", "completed"] } },
  });

  await prisma.$transaction([
    prisma.caravan.update({ where: { id: caravan.id }, data: { published: body.published } }),
    prisma.auditLog.create({
      data: {
        action: body.published ? "fleet:publish" : "fleet:unpublish",
        resource: "caravan", resourceId: caravan.id,
        detail: `${caravan.name} ${body.published ? "published" : "unpublished"} by ${role}; ${future} future reservation(s) on record`,
      },
    }),
  ]);
  return NextResponse.json({ ok: true, published: body.published, futureBookings: future });
}
