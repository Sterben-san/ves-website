import { getMediaMap } from "@/lib/media";
import { adminSlots } from "@/lib/adminSlots";
import { MediaManagerClient } from "./MediaManagerClient";

export const dynamic = "force-dynamic";

export default async function MediaDashboardPage() {
  const media = await getMediaMap();

  return (
    <div>
      <div className="border-b border-slate-200 pb-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-ves-leaf">Section Media</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Editable site media</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">Replace fixed homepage assets, including the hero background video player, enforce crop ratios, preview videos, and maintain accessible alt text.</p>
      </div>
      <MediaManagerClient initialMedia={media} slots={adminSlots} />
    </div>
  );
}
