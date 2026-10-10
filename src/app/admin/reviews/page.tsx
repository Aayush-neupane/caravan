import { prisma } from "@/lib/db";
import { ReviewToggle } from "./toggle";
export const metadata = { title: "Reviews", robots: { index: false, follow: false } };
export default async function ReviewsAdmin() {
  let rows: { id: string; author: string; rating: number; body: string; verified: boolean; published: boolean }[] = [];
  try {
    rows = (await prisma.review.findMany({ take: 50 })).map((r) => ({ id: r.id, author: r.author, rating: r.rating, body: r.body, verified: r.verified, published: r.published }));
  } catch { /* ignore */ }
  return (<div><h1 className="font-display text-4xl">Reviews</h1><p className="mt-2 text-[0.9rem] text-muted">Verified status only when linked to a completed booking. Aggregate ratings are never fabricated for SEO.</p>
  <ul className="mt-4 space-y-3">{rows.map((r) => <li key={r.id} className="border border-border bg-white p-4" style={{ borderRadius: 8 }}><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{r.author} · {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} {r.verified && <span className="text-success">(verified)</span>}</p><ReviewToggle id={r.id} published={r.published} /></div><p className="mt-1 text-[0.9rem]">{r.body}</p></li>)}</ul>
  {rows.length === 0 && <p className="mt-3 text-[0.9rem] text-muted">No reviews yet — storefront shows clearly-labelled demonstration content until real hires complete.</p>}</div>);
}
