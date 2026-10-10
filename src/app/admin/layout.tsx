import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, isStaff } from "@/lib/auth";
import { Compass } from "@/components/editorial/Decor";
import { AdminSignOut } from "./signout";
import { AdminFade } from "./fade";

// Ops dashboards must never serve a stale static snapshot.
// Layout gate is staff-only; per-page and per-API actions enforce narrower
// roles (support/analyst see dashboards with PII masked, mutations need
// can(action, role)).
export const dynamic = "force-dynamic";

const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: "Operate",
    items: [["Overview", "/admin"], ["Bookings", "/admin/bookings"], ["Calendar", "/admin/calendar"], ["Documents", "/admin/documents"]],
  },
  {
    title: "Business",
    items: [["Fleet", "/admin/fleet"], ["Pricing", "/admin/pricing"], ["Coupons", "/admin/coupons"], ["Vouchers", "/admin/vouchers"], ["Payments", "/admin/payments"], ["Maintenance", "/admin/maintenance"]],
  },
  {
    title: "Guests",
    items: [["Customers", "/admin/customers"], ["Reviews", "/admin/reviews"], ["Notifications", "/admin/notifications"]],
  },
  {
    title: "System",
    items: [["Content", "/admin/content"], ["Reports", "/admin/reports"], ["Settings", "/admin/settings"], ["Staff", "/admin/staff"]],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session) redirect("/account/sign-in");
  if (!isStaff(role)) redirect("/account?error=staff_only");

  return (
    <div className="min-h-screen bg-sand/40 md:grid md:grid-cols-[15rem_1fr]">
      {/* Sidebar: header fixed, menu scrolls on its own, account pinned */}
      <aside className="bg-forest text-paper md:sticky md:top-0 md:flex md:h-screen md:flex-col md:overflow-hidden">
        <div className="flex shrink-0 items-center justify-between px-5 pb-4 pt-5 md:block">
          <div className="flex items-center gap-2.5">
            <Compass size={30} className="text-sand" />
            <div>
              <p className="font-display text-[1.4rem] leading-none">Wattle <span className="text-amber">&amp;</span> Wander</p>
              <p className="mt-1.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-paper/75">Operations</p>
            </div>
          </div>
          <Link href="/" className="text-[0.8rem] text-paper/75 underline underline-offset-2 hover:text-white md:mt-3 md:inline-block">
            ← View site
          </Link>
        </div>
        <nav className="flex gap-4 overflow-x-auto px-5 pb-4 md:min-h-0 md:flex-1 md:grid md:gap-5 md:overflow-y-auto md:px-4 md:pb-6" aria-label="Admin">
          {GROUPS.map((g) => (
            <div key={g.title} className="min-w-36 shrink-0 md:min-w-0">
              <p className="hidden font-mono text-[0.66rem] font-bold uppercase tracking-[0.2em] text-amber/80 md:mb-1.5 md:block">{g.title}</p>
              <ul className="flex gap-1.5 md:grid">
                {g.items.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="block whitespace-nowrap rounded-md px-3 py-2 text-[0.85rem] font-medium text-paper/75 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <span className="md:hidden">{g.title} · </span>{label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="shrink-0 border-t border-white/15 px-5 py-3 md:px-4">
          <p className="truncate text-[0.75rem] text-paper/75">{session.user?.email}</p>
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <p className="text-[0.72rem] font-bold uppercase tracking-wider text-amber">{role}</p>
            <div className="w-28"><AdminSignOut /></div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">
        <AdminFade>{children}</AdminFade>
      </div>
    </div>
  );
}
