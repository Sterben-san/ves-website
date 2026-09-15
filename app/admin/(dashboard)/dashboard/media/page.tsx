import { getMediaMap } from "@/lib/media";
import { adminSlots } from "@/lib/adminSlots";
import { getHomepageSectionCopies } from "@/lib/content";
import { editableSectionCopies } from "@/server/application/sectionCopyUseCases";
import type { SectionCopy } from "@/server/domain/entities";
import { MediaManagerClient } from "./MediaManagerClient";
import { SectionCopyManagerClient, type AdminSectionCopy } from "./SectionCopyManagerClient";

export const dynamic = "force-dynamic";

export default async function MediaDashboardPage() {
  const [media, sectionCopyMap] = await Promise.all([getMediaMap(), getHomepageSectionCopies()]);
  const sectionCopies = editableSectionCopies.map((copy) => sectionCopyMap[copy.sectionKey]).filter(Boolean);

  return (
    <div>
      <div className="border-b border-slate-200 pb-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-ves-leaf">Section Media</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Editable site media</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">Replace fixed homepage assets, including the hero background video player, enforce crop ratios, preview videos, and maintain accessible alt text.</p>
      </div>
      <SectionCopyManagerClient initialCopies={sectionCopies.map(serializeSectionCopy)} />
      <MediaManagerClient initialMedia={media} slots={adminSlots} />
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
