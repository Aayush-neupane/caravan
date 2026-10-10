import type { MetadataRoute } from "next";
import { CARAVANS, DESTINATIONS, JOURNAL } from "@/data/catalogue";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const staticRoutes = ["", "/fleet", "/pricing", "/how-it-works", "/towing-guide", "/destinations", "/about", "/contact", "/journal"];
  return [
    ...staticRoutes.map((r) => ({ url: `${base}${r || "/"}`, lastModified: new Date() })),
    ...CARAVANS.map((c) => ({ url: `${base}/fleet/${c.slug}`, lastModified: new Date() })),
    ...DESTINATIONS.map((d) => ({ url: `${base}/destinations/${d.slug}`, lastModified: new Date() })),
    ...JOURNAL.map((j) => ({ url: `${base}/journal/${j.slug}`, lastModified: new Date() })),
  ];
}
