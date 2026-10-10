import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, isStaff } from "@/lib/auth";

const ITEMS = [
  ["Overview", "/admin"], ["Bookings", "/admin/bookings"], ["Calendar", "/admin/calendar"],
  ["Fleet", "/admin/fleet"], ["Customers", "/admin/customers"], ["Documents", "/admin/documents"],
  ["Pricing", "/admin/pricing"], ["Coupons", "/admin/coupons"], ["Payments", "/admin/payments"],
  ["Maintenance", "/admin/maintenance"], ["Reviews", "/admin/reviews"], ["Content", "/admin/content"],
  ["Notifications", "/admin/notifications"], ["Reports", "/admin/reports"], ["Settings", "/admin/settings"], ["Staff", "/admin/staff"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session) redirect("/account/sign-in");
  if (!isStaff(role)) redirect("/account?error=staff_only");
  return (
    <div className="bg-paper">
      <div className="border-b border-border bg-forest text-paper">
        <div className="mx-auto flex max-w-wide items-center justify-between px-5 py-3 sm:px-8">
          <p className="text-[0.85rem]"><strong>Hartley &amp; Moor</strong> · Operations · <span className="text-paper/70">{session.user?.email} ({role})</span></p>
          <Link href="/" className="text-[0.82rem] underline">← View site</Link>
        </div>
      </div>
      <div className="mx-auto grid max-w-wide gap-0 px-0 sm:px-8 lg:grid-cols-12">
        <nav className="border-b border-border bg-white px-5 py-4 lg:col-span-3 lg:border-b-0 lg:border-r lg:px-4" aria-label="Admin">
          <ul className="flex gap-2 overflow-x-auto lg:grid">
            {ITEMS.map(([label, href]) => (
              <li key={href + label} className="shrink-0">
                <Link href={href} className="block border border-border bg-paper px-3 py-2 text-[0.83rem] font-semibold text-charcoal hover:border-forest" style={{ borderRadius: 6 }}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="px-5 py-6 sm:px-2 lg:col-span-9 lg:px-6">{children}</div>
      </div>
    </div>
  );
}
