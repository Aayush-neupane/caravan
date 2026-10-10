import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-forest text-paper">
      <div className="mx-auto grid max-w-wide gap-10 px-5 py-14 sm:px-8 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="font-display text-2xl">Hartley <span className="text-amber">&amp;</span> Moor</p>
          <p className="mt-3 max-w-sm text-[0.92rem] leading-relaxed text-paper/75">
            A considered escape from the ordinary. Three caravans, kept to a high standard, hired from Bath
            for slow travel across {SITE.region}.
          </p>
          <p className="mt-5 text-[0.85rem] text-paper/70">
            {SITE.address}
            <br />{SITE.phone} · {SITE.email}
          </p>
        </div>
        <nav className="md:col-span-2" aria-label="Explore">
          <p className="tick-label !text-paper/60">Explore</p>
          <ul className="mt-3 space-y-2 text-[0.9rem]">
            <li><Link className="hover:text-amber" href="/fleet">Fleet</Link></li>
            <li><Link className="hover:text-amber" href="/pricing">Pricing</Link></li>
            <li><Link className="hover:text-amber" href="/destinations">Destinations</Link></li>
            <li><Link className="hover:text-amber" href="/journal">Journal</Link></li>
          </ul>
        </nav>
        <nav className="md:col-span-2" aria-label="Practical">
          <p className="tick-label !text-paper/60">Practical</p>
          <ul className="mt-3 space-y-2 text-[0.9rem]">
            <li><Link className="hover:text-amber" href="/how-it-works">How it works</Link></li>
            <li><Link className="hover:text-amber" href="/towing-guide">Towing guide</Link></li>
            <li><Link className="hover:text-amber" href="/booking">Book</Link></li>
            <li><Link className="hover:text-amber" href="/contact">Contact</Link></li>
          </ul>
        </nav>
        <nav className="md:col-span-4" aria-label="Legal">
          <p className="tick-label !text-paper/60">Terms &amp; policies</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[0.85rem] text-paper/80">
            <li><Link className="hover:text-amber" href="/legal/terms">Terms</Link></li>
            <li><Link className="hover:text-amber" href="/legal/privacy">Privacy</Link></li>
            <li><Link className="hover:text-amber" href="/legal/cancellation">Cancellation</Link></li>
            <li><Link className="hover:text-amber" href="/legal/deposit">Deposit</Link></li>
            <li><Link className="hover:text-amber" href="/legal/insurance">Insurance</Link></li>
            <li><Link className="hover:text-amber" href="/legal/mileage">Mileage</Link></li>
          </ul>
          <p className="mt-6 border-t border-white/15 pt-4 text-[0.78rem] leading-relaxed text-paper/60">
            Demonstration website. Sample fleet, sample pricing and sample availability.
            Legal pages are templates until approved by the operator.
          </p>
        </nav>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-wide flex-col gap-2 px-5 py-5 text-[0.78rem] text-paper/60 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© {new Date().getFullYear()} Hartley &amp; Moor, Bath. All rights reserved.</span>
          <span>Photography via Unsplash. Alt text on every image.</span>
        </div>
      </div>
    </footer>
  );
}
