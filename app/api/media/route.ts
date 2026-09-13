import { createContainer } from "@/server/config/container";
import { fallbackMedia } from "@/server/application/mediaUseCases";
import { sectionSlots } from "@/server/domain/sectionSlots";
import { json, logPublicRouteFailure } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const media = await createContainer().listMedia.execute();
    return json({ media });
  } catch (error) {
    logPublicRouteFailure("media", error);
    return json({ media: sectionSlots.map((slot) => fallbackMedia(slot.sectionKey)) });
  }
}
