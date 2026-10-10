import type { MetadataRoute } from "next";
import { CARAVANS, DESTINATIONS, JOURNAL } from "@/data/catalogue";

// One build-time date so the sitemap is cacheable — `new Date()` per
// request would make every response unique. Override at build time with
// NEXT_PUBLIC_BUILD_TIME.
const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_TIME
  ? new Date(process.env.NEXT_PUBLIC_BUILD_TIME)
  : new Date("2026-01-01");

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const staticRoutes = ["", "/fleet", "/pricing", "/how-it-works", "/towing-guide", "/destinations", "/about", "/contact", "/journal"];
  return [
    ...staticRoutes.map((r) => ({ url: `${base}${r || "/"}`, lastModified: BUILD_DATE })),
    ...CARAVANS.map((c) => ({ url: `${base}/fleet/${c.slug}`, lastModified: BUILD_DATE })),
    ...DESTINATIONS.map((d) => ({ url: `${base}/destinations/${d.slug}`, lastModified: BUILD_DATE })),
    ...JOURNAL.map((j) => ({ url: `${base}/journal/${j.slug}`, lastModified: BUILD_DATE })),
  ];
}
