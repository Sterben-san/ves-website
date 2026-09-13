import { createContainer } from "@/server/config/container";
import { errorResponse, json } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const announcement = await createContainer().getPublishedAnnouncement.execute(decodeURIComponent(slug));
    return json({ announcement });
  } catch (error) {
    return errorResponse(error, 404);
  }
}
