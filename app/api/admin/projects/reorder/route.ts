import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, json, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1)
});

export async function PATCH(request: NextRequest) {
  try {
    const { container } = await requireAdmin(request);
    const input = schema.parse(await request.json());
    const projects = await container.reorderProjects.execute(input.ids);
    return json({ projects });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
