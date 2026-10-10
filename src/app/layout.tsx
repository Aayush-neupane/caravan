import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#1A2B23",
  width: "device-width",
  initialScale: 1,
};

// Absolute URLs (metadata, sitemap, OG) need a canonical origin. In
// production an unset variable would silently emit localhost links.
if (!process.env.NEXT_PUBLIC_APP_URL && process.env.NODE_ENV === "production") {
  console.warn("NEXT_PUBLIC_APP_URL is not set — canonical URLs will fall back to http://localhost:3000");
}

export const metadata: Metadata = {
  title: {
    default: "Wattle & Wander — Luxury Caravan Hire, Melbourne",
    template: "%s · Wattle & Wander",
  },
  description:
    "Thoughtfully equipped luxury caravans hired from Melbourne for slow travel across Victoria, the Great Ocean Road and Gippsland.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    siteName: "Wattle & Wander",
    locale: "en_AU",
    title: "Wattle & Wander — Luxury Caravan Hire, Melbourne",
    description: "A considered escape from the ordinary. Three caravans, kept to a high standard.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Wattle & Wander caravans in Victoria" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wattle & Wander — Luxury Caravan Hire, Melbourne",
    description: "Thoughtfully equipped luxury caravans hired from Melbourne for slow travel.",
    images: ["/og.jpg"],
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  },
  // Assets must be dropped into public/: icon.png (512), apple-touch-icon.png (180), og.jpg (1200×630).
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${display.variable} ${sans.variable}`}>
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
              name: "Wattle & Wander",
              address: { "@type": "PostalAddress", addressLocality: "Brunswick, Melbourne", addressCountry: "AU" },
              areaServed: "Victoria, Great Ocean Road & Gippsland",
              telephone: "+61 3 9123 4567",
            }).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
