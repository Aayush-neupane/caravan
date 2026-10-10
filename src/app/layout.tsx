import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "../styles/globals.css";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { SwRegister } from "@/components/brand/SwRegister";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Hartley & Moor — Luxury Caravan Hire, Bath",
    template: "%s · Hartley & Moor",
  },
  description:
    "Thoughtfully equipped luxury caravans hired from Bath for slow travel across South West England, the Cotswolds and Wales.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    siteName: "Hartley & Moor",
    title: "Hartley & Moor — Luxury Caravan Hire, Bath",
    description: "A considered escape from the ordinary. Three caravans, kept to a high standard.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${display.variable} ${sans.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-forest focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <SiteHeader />
        <SwRegister />
        <div className="pt-16">
          <main id="main">{children}</main>
        </div>
        <SiteFooter />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "TravelAgency",
              name: "Hartley & Moor",
              address: { "@type": "PostalAddress", addressLocality: "Bath", addressCountry: "GB" },
              areaServed: "South West England, Cotswolds, Wales",
              telephone: "+44 1225 555 014",
            }),
          }}
        />
      </body>
    </html>
  );
}
