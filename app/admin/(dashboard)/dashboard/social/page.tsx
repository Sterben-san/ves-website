import { getAllSocialLinksForAdmin } from "@/lib/content";
import type { SocialLink } from "@/server/domain/entities";
import { SocialDashboardClient, type AdminSocialLink } from "./SocialDashboardClient";

export const dynamic = "force-dynamic";

export default async function SocialDashboardPage() {
  const links = await getAllSocialLinksForAdmin();

  return (
    <div>
      <div className="border-b border-slate-200 pb-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-ves-leaf">Social Links</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Embed-only showcase</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">Paste public Instagram or LinkedIn posts. The site embeds them without OAuth or auto-publishing.</p>
      </div>
      <SocialDashboardClient initialLinks={links.map(serializeLink)} />
    </div>
  );
}

function serializeLink(link: SocialLink): AdminSocialLink {
  return {
    ...link,
    createdAt: link.createdAt.toISOString()
  };
}
