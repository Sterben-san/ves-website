import Link from "next/link";
import { getPublishedAnnouncements } from "@/lib/content";
import type { AnnouncementKind } from "@/server/domain/entities";
import { PublicHeader as Header } from "../components/PublicHeader";
import { Footer } from "../components/Footer";
import { AnnouncementCard } from "../components/AnnouncementCard";
import { getMediaMap } from "@/lib/media";

export const dynamic = "force-dynamic";

const filters: Array<{ label: string; href: string; kind?: AnnouncementKind }> = [
  { label: "All", href: "/news" },
  { label: "Articles", href: "/news?kind=article", kind: "article" },
  { label: "Videos", href: "/news?kind=video", kind: "video" },
  { label: "Updates", href: "/news?kind=update", kind: "update" }
];

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ kind?: AnnouncementKind; page?: string }> }) {
  const params = await searchParams;
  const kind = ["article", "video", "update"].includes(params.kind ?? "") ? params.kind : undefined;
  const page = Number(params.page ?? 1);
  const [announcements, media] = await Promise.all([getPublishedAnnouncements(kind, page), getMediaMap()]);

  return (
    <>
      <Header />
      <main>
        <section className="bg-ves-black text-ves-paper">
          <div className="section-shell pb-16 pt-20">
            <p className="eyebrow text-ves-lime">News</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.06] text-ves-lime md:text-6xl">VES updates and field notes.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ves-paper/72">
              Announcements, articles, and public-lighting updates from the VES team.
            </p>
          </div>
        </section>
        <section className="bg-ves-mist">
          <div className="section-shell">
            <div className="mb-8 flex flex-wrap gap-3">
              {filters.map((filter) => (
                <Link className={`focus-ring rounded px-4 py-2 font-extrabold ${kind === filter.kind ? "bg-ves-leaf text-white" : "bg-ves-cream text-ves-text"}`} href={filter.href} key={filter.href}>
                  {filter.label}
                </Link>
              ))}
            </div>
            {announcements.items.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {announcements.items.map((announcement) => (
                  <AnnouncementCard announcement={announcement} key={announcement.id} />
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-ves-cream px-5 py-8 text-center font-semibold text-ves-ink/60">No published posts yet.</p>
            )}
          </div>
        </section>
      </main>
      <Footer media={media} />
    </>
  );
}
