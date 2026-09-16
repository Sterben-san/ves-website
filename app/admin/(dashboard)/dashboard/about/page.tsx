import { getHomepageSectionCopies } from "@/lib/content";
import { aboutDetailSectionKeys } from "@/server/application/sectionCopyUseCases";
import type { SectionCopy } from "@/server/domain/entities";
import { AboutDashboardClient, type AdminAboutSectionCopy } from "./AboutDashboardClient";

export const dynamic = "force-dynamic";

const aboutSectionKeys = ["home.about", ...aboutDetailSectionKeys];

export default async function AboutDashboardPage() {
  const sectionCopyMap = await getHomepageSectionCopies();
  const sectionCopies = aboutSectionKeys.map((sectionKey) => sectionCopyMap[sectionKey]).filter((copy): copy is SectionCopy => Boolean(copy));

  return (
    <div>
      <div className="border-b border-slate-200 pb-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-ves-leaf">About Section</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Edit About content</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">
          Manage the homepage About text separately from media: heading, paragraph, mission line, and four supporting cards.
        </p>
      </div>
      <div className="mt-6">
        <AboutDashboardClient initialCopies={sectionCopies.map(serializeSectionCopy)} />
      </div>
    </div>
  );
}

function serializeSectionCopy(copy: SectionCopy): AdminAboutSectionCopy {
  return {
    ...copy,
    ctaLabel: copy.ctaLabel ?? "",
    ctaHref: copy.ctaHref ?? "",
    updatedAt: copy.updatedAt.toISOString()
  };
}
