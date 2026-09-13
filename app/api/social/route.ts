import { createContainer } from "@/server/config/container";
import { json, logPublicRouteFailure } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const links = await createContainer().listSocialLinks.execute();
    return json({ links });
  } catch (error) {
    logPublicRouteFailure("social", error);
    return json({ links: [] });
  }
}
