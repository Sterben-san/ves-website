import { z } from "zod";
import { createContainer } from "@/server/config/container";
import { json, logPublicRouteFailure } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  featured: z.enum(["true", "false"]).optional()
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(url.searchParams.entries()));
    const featured = query.featured === undefined ? undefined : query.featured === "true";
    const projects = await createContainer().listPublishedProjects.execute({ featured });
    return json({ projects });
  } catch (error) {
    logPublicRouteFailure("projects", error);
    return json({ projects: [] });
  }
}
