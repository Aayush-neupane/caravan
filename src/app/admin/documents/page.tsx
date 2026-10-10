import { prisma } from "@/lib/db";
export const metadata = { title: "Documents", robots: { index: false, follow: false } };
export default async function DocumentsAdmin() {
  let rows: { id: string; booking: string; kind: string; file: string; status: string }[] = [];
  try {
    const docs = await prisma.customerDocument.findMany({ include: { booking: true }, orderBy: { createdAt: "desc" }, take: 100 });
    rows = docs.map((d) => ({ id: d.id, booking: d.booking.reference, kind: d.kind, file: d.fileName, status: d.status }));
  } catch { /* ignore */ }
  return (<div><h1 className="font-display text-4xl">Documents</h1><p className="mt-2 text-[0.9rem] text-muted">Private storage with signed, short-lived links. Statuses: required → uploaded → under review → approved / rejected / resubmission requested. Rejections require a reason.</p>
  <table className="table-quiet mt-4 bg-white"><thead><tr><th>Booking</th><th>Kind</th><th>File</th><th>Status</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td>{r.booking}</td><td>{r.kind}</td><td>{r.file}</td><td className="font-semibold">{r.status}</td></tr>)}</tbody></table>
  {rows.length === 0 && <p className="mt-3 text-[0.9rem] text-muted">Queue is empty. Seed includes one document awaiting approval.</p>}</div>);
}
