import { prisma } from "@/lib/db";
export const metadata = { title: "Notifications", robots: { index: false, follow: false } };
export default async function NotificationsAdmin() {
  let rows: { kind: string; to: string; subject: string; status: string; at: string }[] = [];
  try {
    rows = (await prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 100 })).map((n) => ({ kind: n.kind, to: n.to, subject: n.subject, status: n.status, at: n.createdAt.toISOString().slice(0, 16).replace("T", " ") }));
  } catch { /* ignore */ }
  return (<div><h1 className="font-display text-4xl">Notifications</h1><p className="mt-2 text-[0.9rem] text-muted">Confirmation, receipts, reminders, document decisions, cancellations, refunds, review requests. Delivery records with failure + retry; duplicate webhook confirmations are never re-sent.</p>
  <table className="table-quiet mt-4 bg-white"><thead><tr><th>When</th><th>Kind</th><th>To</th><th>Subject</th><th>Status</th></tr></thead><tbody>{rows.map((r, i) => <tr key={i}><td>{r.at}</td><td>{r.kind}</td><td>{r.to}</td><td>{r.subject}</td><td className="font-semibold">{r.status}</td></tr>)}</tbody></table>
  {rows.length === 0 && <p className="mt-3 text-[0.9rem] text-muted">No notifications yet.</p>}</div>);
}
