import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { gateMutation } from "@/lib/security";

// DELETE /api/admin/blocks/:id — lift a blackout (audit kept).
// Lifting is owner/admin-only: the creator role (fleet_manager) can place
// holds, but removing someone else's block needs separation of duties.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const denied = gateMutation(_req, "admin:maintenance", 60, 60_000);
  if (denied) return denied;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !["owner", "admin"].includes(role ?? "")) return NextResponse.json({ error: "Owner or admin required to lift blackouts." }, { status: 403 });

  const row = await prisma.availabilityBlock.findUnique({ where: { id: params.id } });
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  try {
    await prisma.availabilityBlock.delete({ where: { id: row.id } });
  } catch {
    return NextResponse.json({ error: "Already removed." }, { status: 404 });
  }
  await prisma.auditLog.create({
    data: { action: "blocks:delete", resource: "block", resourceId: row.id, detail: `${row.reason} ${row.startDate.toISOString().slice(0, 10)} lifted by ${session.user?.email ?? role}` },
  });
  return NextResponse.json({ ok: true });
}
