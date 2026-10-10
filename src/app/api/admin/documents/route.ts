import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions, can } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gateMutation } from "@/lib/security";

const Body = z.object({
  bookingRef: z.string().min(3).max(24),
  kind: z.enum(["driving_licence", "id", "insurance", "other"]),
  reviewerNote: z.string().max(500).regex(/^[^<>]*$/, "Angle brackets are not allowed.").optional(),
}).strict();

// POST /api/admin/documents — log a physically received document at the
// depot counter. Nothing is uploaded: staff see originals, record them here
// as approved, and the record gates handover approval.
export async function POST(req: Request) {
  const denied = gateMutation(req, "admin:documents", 60, 60_000);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !can("documents:review", role)) return NextResponse.json({ error: "Document reviewer role required." }, { status: 403 });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Booking reference and document kind required." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { reference: body.bookingRef.trim().toUpperCase() } });
  if (!booking) return NextResponse.json({ error: "No booking with that reference." }, { status: 404 });

  const created = await prisma.customerDocument.create({
    data: {
      bookingId: booking.id,
      kind: body.kind,
      fileName: "Physical copy seen at counter",
      fileUrl: "counter://physical",
      status: "approved",
      reviewerNote: body.reviewerNote?.trim() || null,
    },
  });
  await prisma.auditLog.create({
    data: {
      action: "documents:physical_receipt", resource: "document", resourceId: created.id,
      detail: `${body.kind} for ${booking.reference} seen + approved by ${session.user?.email ?? role}`,
    },
  });
  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
