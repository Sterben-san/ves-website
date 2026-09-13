import Link from "next/link";
import { getAllAnnouncementsForAdmin } from "@/lib/content";
import type { Announcement } from "@/server/domain/entities";
import { AnnouncementDashboardClient, type AdminAnnouncement } from "./AnnouncementDashboardClient";

export const dynamic = "force-dynamic";

export default async function AnnouncementsDashboardPage() {
  const announcements = await getAllAnnouncementsForAdmin();

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-ves-leaf">Announcements</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">News and hero updates</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">
            Create public announcements, feature updates, videos, and milestones for the News page and pinned homepage alert.
          </p>
        </div>
        <Link className="focus-ring rounded bg-ves-ink px-4 py-2 text-sm font-black text-white" href="/admin/dashboard/announcements/new">
          New Announcement
        </Link>
      </div>
      <AnnouncementDashboardClient initialAnnouncements={announcements.map(serializeAnnouncement)} />
    </div>
  );
}

function serializeAnnouncement(announcement: Announcement): AdminAnnouncement {
  return {
    ...announcement,
    createdAt: announcement.createdAt.toISOString(),
    updatedAt: announcement.updatedAt.toISOString()
  };
}
