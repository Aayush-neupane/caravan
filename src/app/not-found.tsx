import type { Metadata } from "next";
import { CinematicHero } from "@/components/editorial/Hero";

export const metadata: Metadata = {
  title: "That lane does not exist",
  robots: { index: false, follow: false },
};

// A wrong turn gets only the scenery, the drive, and the verdict.
export default function NotFound() {
  return <CinematicHero bare phrase="This page doesn't exist" />;
}
