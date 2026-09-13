import { z } from "zod";
import { createContainer } from "@/server/config/container";
import { json, logPublicRouteFailure } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  kind: z.enum(["article", "video", "update"]).optional(),
  page: z.coerce.number().int().positive().optional()
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(url.searchParams.entries()));
    const result = await createContainer().listPublishedAnnouncements.execute(query);
    return json(result);
  } catch (error) {
    logPublicRouteFailure("announcements", error);
    return json({ items: [], page: 1, pageSize: 12, total: 0, totalPages: 1 });
  }
}
