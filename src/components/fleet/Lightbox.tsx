"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type GalleryImage = { url: string; alt: string; kind: string };

// Full-screen viewer: next/previous, close, keyboard, focus return.
// Never a fake 360° — just honest photographs, large.
export function Lightbox({ images, name }: { images: GalleryImage[]; name: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setIndex(null);
    lastFocus.current?.focus?.();
  }, []);

  const step = useCallback((dir: number) => {
    setIndex((i) => (i == null ? i : (i + dir + images.length) % images.length));
  }, [images.length]);

  useEffect(() => {
    if (index == null) return;
    lastFocus.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, close, step]);

  const open = (i: number) => setIndex(i);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <button type="button" onClick={() => open(0)} className="group block w-full" aria-label={`Open ${name} photo viewer`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[0].url} alt={images[0].alt} className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]" style={{ borderRadius: 10 }} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:col-span-4 lg:grid-cols-1">
          {images.slice(1, 3).map((im, k) => (
            <button key={im.url} type="button" onClick={() => open(k + 1)} className="group block w-full" aria-label={`Open photo: ${im.alt.slice(0, 60)}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.url.replace("w=1600", "w=800")} alt={im.alt} loading="lazy" className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] lg:aspect-[16/9]" style={{ borderRadius: 8 }} />
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {index != null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${name} photo viewer — photo ${index + 1} of ${images.length}`}
            initial={reduce ? { opacity: 0 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex flex-col bg-[#122019]/95 p-4 sm:p-8"
            onClick={close}
          >
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between text-paper" onClick={(e) => e.stopPropagation()}>
              <p className="text-[0.85rem]">{name} · {index + 1} / {images.length}</p>
              <button ref={closeRef} type="button" onClick={close} aria-label="Close viewer" className="border border-white/40 px-4 py-2 text-[0.85rem] font-bold hover:border-white" style={{ borderRadius: 6 }}>Close ✕</button>
            </div>
            <div className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center gap-2 py-4" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className="border border-white/40 px-3 py-3 text-lg font-bold text-paper hover:border-white" style={{ borderRadius: 6 }}>←</button>
              <motion.figure
                key={images[index].url}
                initial={reduce ? false : { opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className="min-w-0 flex-1"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={images[index].url} alt={images[index].alt} className="max-h-[70vh] w-full object-contain" style={{ borderRadius: 8 }} />
                <figcaption className="mt-2 text-center text-[0.85rem] text-paper/75">{images[index].alt}</figcaption>
              </motion.figure>
              <button type="button" onClick={() => step(1)} aria-label="Next photo" className="border border-white/40 px-3 py-3 text-lg font-bold text-paper hover:border-white" style={{ borderRadius: 6 }}>→</button>
            </div>
            <div className="mx-auto flex w-full max-w-5xl justify-center gap-2 pb-2" onClick={(e) => e.stopPropagation()}>
              {images.map((im, i) => (
                <button
                  key={im.url}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to photo ${i + 1}`}
                  aria-current={i === index}
                  className={`h-2.5 w-8 ${i === index ? "bg-amber" : "bg-white/30 hover:bg-white/60"}`}
                  style={{ borderRadius: 2 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
