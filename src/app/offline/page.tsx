import type { Metadata } from "next";
import { CinematicHero } from "@/components/editorial/Hero";

export const metadata: Metadata = {
  title: "You are offline",
  robots: { index: false, follow: false },
};

// Offline fallback: only the scenery, the drive, and the verdict.
// (Wire /offline as the service-worker fallback to serve it offline.)
export default function OfflinePage() {
  return <CinematicHero bare phrase="No internet connection" />;
}
