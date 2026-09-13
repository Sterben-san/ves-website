import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { defaultNewsSectionCopy } from "@/server/application/sectionCopyUseCases";
import type { HomepageNewsItem, SectionCopy } from "@/server/domain/entities";

export function LatestUpdates({ items, copy }: { items: HomepageNewsItem[]; copy: SectionCopy }) {
  const sectionCopy = copy ?? {
    ...defaultNewsSectionCopy,
    id: defaultNewsSectionCopy.sectionKey,
    updatedAt: new Date(0)
  };
  if (!sectionCopy.visible || items.length === 0) return null;

  const marqueeItems = [...items, ...items];
  const newsGap = items.length <= 3 ? 96 : items.length <= 6 ? 56 : 32;
  const sectionClass = {
    dark: "bg-ves-black text-ves-paper",
    green: "bg-ves-ink text-ves-paper",
    light: "bg-ves-mist text-ves-text"
  }[sectionCopy.theme];
  const headingClass = sectionCopy.theme === "light" ? "text-ves-text" : "text-white";
  const bodyClass = sectionCopy.theme === "light" ? "text-ves-text/72" : "text-ves-paper/72";

  return (
    <section id="news" className={sectionClass}>
      <div className="section-shell">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="eyebrow text-ves-lime">{sectionCopy.eyebrow}</p>
            <h2 className={`mt-4 text-3xl font-extrabold leading-[1.08] md:text-5xl ${headingClass}`}>
              {sectionCopy.title}
            </h2>
          </div>
          <div className={`grid gap-4 text-base leading-8 md:text-lg ${bodyClass}`}>
            <p>{sectionCopy.body}</p>
            {sectionCopy.ctaLabel && sectionCopy.ctaHref ? (
              <Link className="focus-ring w-fit rounded bg-ves-lime px-4 py-2 text-sm font-black text-ves-black transition hover:bg-ves-paper" href={sectionCopy.ctaHref}>
                {sectionCopy.ctaLabel}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="ves-news-marquee mt-10" style={{ "--news-gap": `${newsGap}px`, "--news-duration": `${sectionCopy.animationSeconds}s` } as CSSProperties} aria-label="Moving VES news updates">
          <div className={`ves-news-track ${sectionCopy.animationDirection === "left" ? "ves-news-track-left" : "ves-news-track-right"}`}>
            {marqueeItems.map((item, index) => (
              <NewsMarqueeCard item={item} key={`${item.id}-${index}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NewsMarqueeCard({ item }: { item: HomepageNewsItem }) {
  const href = item.linkHref || "/news";

  return (
    <Link className="ves-news-card group focus-ring" href={href}>
      <div className="relative aspect-[16/10] overflow-hidden bg-ves-deep">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 768px) 82vw, 380px" />
        ) : (
          <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_25%_20%,rgba(242,201,76,0.24),transparent_34%),linear-gradient(135deg,#07100d,#174b35)] px-8 text-center text-4xl font-black text-ves-lime">
            {item.kind}
          </div>
        )}
      </div>
      <div className="p-5">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-ves-lime">{item.kind}</p>
        <h3 className="mt-3 line-clamp-2 text-2xl font-extrabold leading-[1.1] text-white">{item.title}</h3>
        <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm font-medium leading-6 text-ves-paper/68">{item.summary}</p>
        <span className="mt-5 inline-flex text-sm font-black text-ves-lime">{item.linkLabel || "Read More"}</span>
      </div>
    </Link>
  );
}
