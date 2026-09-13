import { AnnouncementEditorClient } from "../AnnouncementEditorClient";

export const dynamic = "force-dynamic";

export default function NewAnnouncementPage() {
  return <AnnouncementEditorClient mode="create" />;
}
