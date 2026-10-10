import { prisma } from "@/lib/db";
export const metadata = { title: "Staff", robots: { index: false, follow: false } };
const ROLES = ["owner", "admin", "booking_manager", "fleet_manager", "document_reviewer", "support", "analyst"];
export default async function StaffAdmin() {
  let users: { email: string; role: string }[] = [];
  let logs: { at: string; action: string; resource: string }[] = [];
  try {
    users = (await prisma.user.findMany({ take: 50 })).map((u) => ({ email: u.email, role: u.role }));
    logs = (await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 })).map((l) => ({ at: l.createdAt.toISOString().slice(0, 16).replace("T", " "), action: l.action, resource: `${l.resource}${l.resourceId ? `/${l.resourceId.slice(0, 8)}` : ""}` }));
  } catch { /* ignore */ }
  return (<div><h1 className="font-display text-4xl">Staff &amp; audit</h1><p className="mt-2 text-[0.9rem] text-muted">Roles: {ROLES.join(" · ")}. Authorization enforced server-side on every protected operation — UI hiding alone never grants access.</p>
  <h2 className="mt-6 font-semibold">Users</h2><table className="table-quiet mt-2 bg-white"><thead><tr><th>Email</th><th>Role</th></tr></thead><tbody>{users.map((u) => <tr key={u.email}><td>{u.email}</td><td className="font-semibold">{u.role}</td></tr>)}</tbody></table>
  <h2 className="mt-6 font-semibold">Audit log (actor · time · action · resource)</h2><table className="table-quiet mt-2 bg-white"><thead><tr><th>When</th><th>Action</th><th>Resource</th></tr></thead><tbody>{logs.map((l, i) => <tr key={i}><td>{l.at}</td><td>{l.action}</td><td>{l.resource}</td></tr>)}</tbody></table>
  {users.length === 0 && <p className="mt-3 text-[0.9rem] text-muted">No staff rows — seed creates an owner account.</p>}</div>);
}
