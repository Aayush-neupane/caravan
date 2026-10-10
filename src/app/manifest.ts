import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wattle & Wander — Luxury Caravan Hire",
    short_name: "Wattle & Wander",
    description:
      "Thoughtfully equipped caravans hired from Melbourne for slow travel across Victoria, the Great Ocean Road and Gippsland.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F7F2",
    theme_color: "#1A2B23",
    icons: [
      // Assets must be added to public/: icon.png (512×512) and apple-touch-icon.png (180×180).
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
