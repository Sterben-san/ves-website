import { createContainer } from "@/server/config/container";
import { json, logPublicRouteFailure } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const announcement = await createContainer().getPinnedAnnouncement.execute();
    return json({ announcement });
  } catch (error) {
    logPublicRouteFailure("announcements/pinned", error);
    return json({ announcement: null });
  }
}
