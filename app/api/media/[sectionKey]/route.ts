import { createContainer } from "@/server/config/container";
import { fallbackMedia } from "@/server/application/mediaUseCases";
import { errorResponse, json, logPublicRouteFailure } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ sectionKey: string }> }) {
  try {
    const { sectionKey } = await params;
    const media = await createContainer().getMedia.execute(decodeURIComponent(sectionKey));
    return json({ media });
  } catch (error) {
    logPublicRouteFailure("media/[sectionKey]", error);
    try {
      const { sectionKey } = await params;
      return json({ media: fallbackMedia(decodeURIComponent(sectionKey)) });
    } catch {
      return errorResponse(error, 404);
    }
  }
}
