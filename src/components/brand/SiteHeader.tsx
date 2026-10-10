"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, SITE } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b transition-colors ${
        scrolled ? "border-border" : "border-transparent"
      }`}
      style={{ background: scrolled ? "#F8F7F2" : "rgba(248,247,242,0.92)" }}
    >
      <div className="mx-auto flex h-16 max-w-wide items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex items-baseline gap-3" aria-label={`${SITE.brand} home`}>
          <span className="font-display text-[1.45rem] leading-none text-forest">Hartley <span className="text-amberDark">&amp;</span> Moor</span>
          <span className="hidden text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted md:inline">Caravan Hire · Bath</span>
        </Link>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {NAV.slice(0, 6).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-[0.86rem] font-medium ${pathname === n.href ? "text-forest underline underline-offset-4" : "text-charcoal/80 hover:text-forest"}`}
            >
              {n.label}
            </Link>
          ))}
          <Link href="/booking" className="btn-primary !py-2.5 !px-5 !text-[0.86rem]">
            Check availability
          </Link>
        </nav>
        <div className="flex items-center gap-2 lg:hidden">
          <Link href="/booking" className="btn-primary !py-2 !px-4 !text-[0.82rem]">
            Book
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="border border-border bg-white px-3 py-2 text-sm font-semibold text-forest"
            style={{ borderRadius: 6 }}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-border bg-paper px-5 py-4 lg:hidden" aria-label="Mobile">
          <ul className="grid gap-1">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="block py-2 text-[0.95rem] font-medium text-charcoal hover:text-forest">
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/account" className="block py-2 text-[0.95rem] font-medium text-charcoal hover:text-forest">
                Account
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
