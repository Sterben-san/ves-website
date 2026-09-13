import { createContainer } from "@/server/config/container";
import { json, logPublicRouteFailure } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const internships = await createContainer().listActiveInternships.execute();
    return json({ internships });
  } catch (error) {
    logPublicRouteFailure("internships", error);
    return json({ internships: [] });
  }
}
