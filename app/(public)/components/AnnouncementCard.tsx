import Image from "next/image";
import Link from "next/link";
import type { Announcement } from "@/server/domain/entities";

export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const mediaUrl = announcement.posterUrl || announcement.mobileFallbackUrl || announcement.backgroundUrl;
  return (
    <article className="overflow-hidden rounded border border-ves-leaf/20 bg-ves-cream shadow-soft">
      {mediaUrl ? (
        <div className="relative aspect-video bg-ves-mist">
          <Image src={mediaUrl} alt="" fill className="object-cover" />
        </div>
      ) : null}
      <div className="p-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-ves-leaf">{announcement.kind}</p>
        <h3 className="mt-3 text-2xl font-extrabold leading-[1.12] text-ves-text">{announcement.title}</h3>
        <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-base leading-7 text-ves-text/70">{announcement.body}</p>
        <Link className="focus-ring mt-5 inline-block rounded bg-ves-leaf px-4 py-2 text-sm font-extrabold text-white" href={`/news/${announcement.slug}`}>
          Read More
        </Link>
      </div>
    </article>
  );
}
