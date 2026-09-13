import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublishedAnnouncement } from "@/lib/content";
import { getMediaMap } from "@/lib/media";
import { PublicHeader as Header } from "../../components/PublicHeader";
import { Footer } from "../../components/Footer";

export const dynamic = "force-dynamic";

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [announcement, media] = await Promise.all([getPublishedAnnouncement(slug), getMediaMap()]);
  if (!announcement) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="bg-ves-field">
        <article>
          <header className="bg-ves-black text-ves-paper">
            <div className="section-shell max-w-4xl">
              <p className="eyebrow text-ves-lime">{announcement.kind}</p>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.06] text-ves-lime md:text-6xl">{announcement.title}</h1>
              <p className="mt-4 font-semibold text-ves-paper/55">{new Date(announcement.createdAt).toLocaleDateString()}</p>
            </div>
          </header>
          <div className="section-shell max-w-4xl">
          {announcement.backgroundUrl || announcement.posterUrl ? (
            <div className="relative aspect-video overflow-hidden rounded border border-ves-leaf/20 bg-ves-mist shadow-soft">
              {announcement.backgroundType === "video" && announcement.backgroundUrl ? (
                <video className="h-full w-full object-cover" src={announcement.backgroundUrl} poster={announcement.posterUrl} controls />
              ) : (
                <Image src={announcement.posterUrl || announcement.backgroundUrl || ""} alt="" fill className="object-cover" />
              )}
            </div>
          ) : null}
          <div className="mt-8 whitespace-pre-wrap text-lg leading-9 text-ves-text/78">{announcement.body}</div>
          </div>
        </article>
      </main>
      <Footer media={media} />
    </>
  );
}
