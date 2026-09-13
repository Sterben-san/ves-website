import { getAllHomepageNewsForAdmin, getNewsSectionCopy } from "@/lib/content";
import type { HomepageNewsItem, SectionCopy } from "@/server/domain/entities";
import { HomepageNewsDashboardClient, type AdminHomepageNewsItem } from "./HomepageNewsDashboardClient";
import { NewsSectionCopyEditor, type AdminSectionCopy } from "./NewsSectionCopyEditor";

export const dynamic = "force-dynamic";

export default async function HomepageNewsDashboardPage() {
  const [newsSectionCopy, items] = await Promise.all([getNewsSectionCopy(), getAllHomepageNewsForAdmin()]);

  return (
    <div>
      <div className="border-b border-slate-200 pb-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-ves-leaf">Homepage News</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">News section controls</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">
          Customize the homepage News section separately from Announcements.
        </p>
      </div>
      <NewsSectionCopyEditor initialCopy={serializeSectionCopy(newsSectionCopy)} />
      <HomepageNewsDashboardClient initialItems={items.map(serializeHomepageNewsItem)} />
    </div>
  );
}

function serializeSectionCopy(copy: SectionCopy): AdminSectionCopy {
  return {
    ...copy,
    ctaLabel: copy.ctaLabel ?? "",
    ctaHref: copy.ctaHref ?? "",
    updatedAt: copy.updatedAt.toISOString()
  };
}

function serializeHomepageNewsItem(item: HomepageNewsItem): AdminHomepageNewsItem {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString()
  };
}
