import { prisma } from "@/lib/db";
export const metadata = { title: "Content", robots: { index: false, follow: false } };
export default async function ContentAdmin() {
  let dests: { name: string; slug: string }[] = [];
  let articles: { title: string; slug: string; cat: string }[] = [];
  try {
    dests = (await prisma.destination.findMany()).map((d) => ({ name: d.name, slug: d.slug }));
    articles = (await prisma.journalArticle.findMany()).map((a) => ({ title: a.title, slug: a.slug, cat: a.category }));
  } catch { /* ignore */ }
  return (<div><h1 className="font-display text-4xl">Destinations &amp; journal</h1><p className="mt-2 text-[0.9rem] text-muted">Editorial content lives here (or in Sanity/Strapi in production). Availability, pricing and reservations always stay in the application database — never duplicated in the CMS.</p>
  <h2 className="mt-6 font-semibold">Destinations ({dests.length})</h2><ul className="mt-2 space-y-1 text-[0.9rem]">{dests.map((d) => <li key={d.slug} className="border-b border-border py-1.5">{d.name} <span className="text-muted">/{d.slug}</span></li>)}</ul>
  <h2 className="mt-6 font-semibold">Journal ({articles.length})</h2><ul className="mt-2 space-y-1 text-[0.9rem]">{articles.map((a) => <li key={a.slug} className="border-b border-border py-1.5">{a.title} <span className="text-muted">· {a.cat}</span></li>)}</ul></div>);
}
