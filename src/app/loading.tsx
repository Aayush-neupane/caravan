import { Compass } from "@/components/editorial/Decor";

// Route-transition loader: the compass needle spins while the next page
// reads the map. Static under reduced motion.
export default function Loading() {
  return (
    <div className="flex min-h-[70svh] flex-col items-center justify-center gap-4 bg-paper px-5 py-24" role="status" aria-label="Loading">
      <span className="animate-[stamp-rotate_2.5s_linear_infinite] motion-reduce:animate-none">
        <Compass size={64} className="text-forest" />
      </span>
      <p className="font-display text-2xl text-charcoal">Reading the map…</p>
      <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.22em] text-muted">Wattle &amp; Wander · Melbourne</p>
    </div>
  );
}
