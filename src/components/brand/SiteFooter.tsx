import Link from "next/link";
import { SITE } from "@/lib/site";
import { Compass, TopoLines } from "@/components/editorial/Decor";

export function SiteFooter() {
  return (
    <footer className="grain relative overflow-hidden bg-forest text-paper">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true"><TopoLines dark variant={1} /></div>
      <div className="relative z-[2] mx-auto grid max-w-wide gap-10 px-5 py-14 sm:px-8 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="flex items-center gap-3">
            <Compass size={34} className="text-sand" />
            <p translate="no" className="font-display text-2xl">Wattle <span className="text-amber">&amp;</span> Wander</p>
          </div>
          <p className="mt-3 max-w-sm text-balance text-[0.92rem] leading-relaxed text-paper/75">
            A considered escape from the ordinary. Three caravans, kept to a high standard, hired from Melbourne
            for slow travel across {SITE.region}.
          </p>
          <p className="mt-5 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-paper/75">
            {SITE.address} · Melways 29 E12
            <br />
            <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="underline hover:text-amber">{SITE.phone}</a>
            {" · "}
            <a href={`mailto:${SITE.email}`} className="underline hover:text-amber">{SITE.email}</a>
          </p>
        </div>
        <nav className="md:col-span-2" aria-label="Explore">
          <p className="tick-label tick-label-light">Explore</p>
          <ul className="mt-3 space-y-2 text-[0.9rem]">
            <li><Link className="hover:text-amber" href="/fleet">Fleet</Link></li>
            <li><Link className="hover:text-amber" href="/pricing">Pricing</Link></li>
            <li><Link className="hover:text-amber" href="/destinations">Destinations</Link></li>
            <li><Link className="hover:text-amber" href="/journal">Journal</Link></li>
            <li><Link className="hover:text-amber" href="/about">About</Link></li>
          </ul>
        </nav>
        <nav className="md:col-span-2" aria-label="Practical">
          <p className="tick-label tick-label-light">Practical</p>
          <ul className="mt-3 space-y-2 text-[0.9rem]">
            <li><Link className="hover:text-amber" href="/how-it-works">How it works</Link></li>
            <li><Link className="hover:text-amber" href="/towing-guide">Towing guide</Link></li>
            <li><Link className="hover:text-amber" href="/booking">Book</Link></li>
            <li><Link className="hover:text-amber" href="/contact">Contact</Link></li>
          </ul>
        </nav>
        <nav className="md:col-span-4" aria-label="Legal">
          <p className="tick-label tick-label-light">Terms &amp; policies</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[0.85rem] text-paper/80">
            <li><Link className="hover:text-amber" href="/legal/terms">Terms</Link></li>
            <li><Link className="hover:text-amber" href="/legal/privacy">Privacy</Link></li>
            <li><Link className="hover:text-amber" href="/legal/cancellation">Cancellation</Link></li>
            <li><Link className="hover:text-amber" href="/legal/deposit">Deposit</Link></li>
            <li><Link className="hover:text-amber" href="/legal/insurance">Insurance</Link></li>
            <li><Link className="hover:text-amber" href="/legal/mileage">Mileage</Link></li>
            <li><Link className="hover:text-amber" href="/legal/cookies">Cookies</Link></li>
            <li><Link className="hover:text-amber" href="/legal/refund">Refunds</Link></li>
            <li><Link className="hover:text-amber" href="/legal/eligibility">Eligibility</Link></li>
          </ul>
          <p className="mt-6 border-t border-white/15 pt-4 text-[0.78rem] leading-relaxed text-paper/75">
            Brunswick Depot · 123 Sydney Rd, Brunswick VIC 3056 · Mon–Sat 09:00–16:00.
          </p>
        </nav>
      </div>
      <div className="relative z-[2] border-t border-white/15">
        <div className="mx-auto flex max-w-wide flex-col gap-2 px-5 py-5 text-[0.78rem] text-paper/75 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© {new Date().getFullYear()} Wattle &amp; Wander, Melbourne. All rights reserved.</span>
          <span>Photography via Unsplash & Pexels. Alt text on every image.</span>
        </div>
      </div>
    </footer>
  );
}
