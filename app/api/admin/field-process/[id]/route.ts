import { NextRequest } from "next/server";
import { z } from "zod";
import { assertSameOrigin, errorResponse, json, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  phase: z.string().min(1),
  copy: z.string().min(1),
  displayOrder: z.coerce.number().optional()
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const { container } = await requireAdmin(request);
    const { id } = await params;
    const input = schema.parse(await request.json());
    const step = await container.updateFieldProcessStep.execute(id, input);
    return json({ step });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
