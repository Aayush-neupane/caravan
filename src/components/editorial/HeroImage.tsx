"use client";

import { motion, useReducedMotion } from "framer-motion";

// Slow cinematic drift for the hero photograph. Static frame when the
// visitor prefers reduced motion. The overlay keeps text legible.
export function HeroImage({ src, alt }: { src: string; alt: string }) {
  const reduce = useReducedMotion();
  if (reduce) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className="h-full w-full object-cover opacity-90" loading="eager" />;
  }
  return (
    <motion.div
      className="h-full w-full"
      initial={{ scale: 1 }}
      animate={{ scale: 1.08 }}
      transition={{ duration: 22, ease: "linear" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover opacity-90" loading="eager" />
    </motion.div>
  );
}
