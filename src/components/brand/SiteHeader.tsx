"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV, SITE } from "@/lib/site";
import { Compass } from "@/components/editorial/Decor";

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  // Mobile panel: Escape closes it and returns focus to the toggle;
  // opening moves focus into the panel so keyboard users land inside it.
  // Body scroll is locked while open; focus is contained to the panel.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab") {
        const items = panelRef.current?.querySelectorAll<HTMLElement>("a, button");
        if (!items || items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b transition-colors ${
        scrolled ? "border-border" : "border-transparent"
      } bg-paper ${scrolled ? "" : "bg-paper/90"}`}
    >
      <div className="mx-auto flex h-16 max-w-wide items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={`${SITE.brand} home`}>
          <Compass size={30} className="shrink-0 text-forest" />
          <span translate="no" className="truncate font-display text-[1.45rem] leading-none text-forest">Wattle <span className="text-amberDark">&amp;</span> Wander</span>
        </Link>
        <nav className="hidden items-center gap-4 lg:flex xl:gap-6" aria-label="Primary">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`text-[0.86rem] font-medium ${pathname === n.href ? "text-forest underline underline-offset-4" : "text-charcoal/80 hover:text-forest"}`}
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/account"
            className={`text-[0.86rem] font-medium ${pathname === "/account" ? "text-forest underline underline-offset-4" : "text-charcoal/80 hover:text-forest"}`}
          >
            Find reservation
          </Link>
          <Link href="/booking" className="btn-primary !py-2.5 !px-5 !text-[0.86rem]">
            Check availability
          </Link>
        </nav>
        <div className="flex items-center gap-2 lg:hidden">
          <Link href="/booking" className="btn-primary !py-2 !px-4 !text-[0.82rem]">
            Book
          </Link>
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="rounded-md border border-border bg-white px-3 py-2 min-h-[44px] min-w-[44px] text-sm font-semibold text-forest"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" ref={panelRef} className="overscroll-contain border-t border-border bg-paper px-5 py-4 lg:hidden" aria-label="Mobile" aria-modal="true" role="dialog">
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
                Find reservation
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
