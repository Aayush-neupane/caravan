import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions, isStaff } from "@/lib/auth";
import { Compass } from "@/components/editorial/Decor";
import { AdminSignOut } from "./signout";
import { AdminFade } from "./fade";

const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: "Operate",
    items: [["Overview", "/admin"], ["Bookings", "/admin/bookings"], ["Calendar", "/admin/calendar"], ["Documents", "/admin/documents"]],
  },
  {
    title: "Business",
    items: [["Fleet", "/admin/fleet"], ["Pricing", "/admin/pricing"], ["Coupons", "/admin/coupons"], ["Payments", "/admin/payments"], ["Maintenance", "/admin/maintenance"]],
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
    <div className="min-h-screen bg-[#EFEDE6] lg:grid lg:grid-cols-[15rem_1fr]">
      {/* Sidebar: header fixed, menu scrolls on its own, account pinned */}
      <aside className="bg-forest text-paper lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
        <div className="flex shrink-0 items-center justify-between px-5 pb-4 pt-5 lg:block">
          <div className="flex items-center gap-2.5">
            <Compass size={30} className="text-sand" />
            <div>
              <p className="font-display text-[1.4rem] leading-none">Hartley <span className="text-amber">&amp;</span> Moor</p>
              <p className="mt-1.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-paper/55">Operations</p>
            </div>
          </div>
          <Link href="/" className="text-[0.8rem] text-paper/70 underline underline-offset-2 hover:text-white lg:mt-3 lg:inline-block">
            ← View site
          </Link>
        </div>
        <nav className="flex gap-4 overflow-x-auto px-5 pb-4 lg:min-h-0 lg:flex-1 lg:grid lg:gap-5 lg:overflow-y-auto lg:px-4 lg:pb-6" aria-label="Admin">
          {GROUPS.map((g) => (
            <div key={g.title} className="min-w-36 shrink-0 lg:min-w-0">
              <p className="hidden font-mono text-[0.66rem] font-bold uppercase tracking-[0.2em] text-amber/80 lg:mb-1.5 lg:block">{g.title}</p>
              <ul className="flex gap-1.5 lg:grid">
                {g.items.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="block whitespace-nowrap px-3 py-2 text-[0.85rem] font-medium text-paper/80 transition-colors hover:bg-white/10 hover:text-white"
                      style={{ borderRadius: 6 }}
                    >
                      <span className="lg:hidden">{g.title} · </span>{label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="shrink-0 border-t border-white/15 px-5 py-3 lg:px-4">
          <p className="truncate text-[0.75rem] text-paper/55">{session.user?.email}</p>
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
