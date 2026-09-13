import { notFound } from "next/navigation";
import { getAllAnnouncementsForAdmin } from "@/lib/content";
import type { Announcement } from "@/server/domain/entities";
import { AnnouncementEditorClient } from "../AnnouncementEditorClient";
import type { AdminAnnouncement } from "../AnnouncementDashboardClient";

export const dynamic = "force-dynamic";

export default async function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const announcements = await getAllAnnouncementsForAdmin();
  const announcement = announcements.find((item) => item.id === id);
  if (!announcement) notFound();
  return <AnnouncementEditorClient initialAnnouncement={serializeAnnouncement(announcement)} mode="edit" />;
}

function serializeAnnouncement(announcement: Announcement): AdminAnnouncement {
  return {
    ...announcement,
    createdAt: announcement.createdAt.toISOString(),
    updatedAt: announcement.updatedAt.toISOString()
  };
}
