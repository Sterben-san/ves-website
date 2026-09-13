import { createContainer } from "@/server/config/container";
import { json, logPublicRouteFailure } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const members = await createContainer().listActiveTeamMembers.execute();
    return json({ members });
  } catch (error) {
    logPublicRouteFailure("team", error);
    return json({ members: [] });
  }
}
