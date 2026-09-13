import { NextRequest } from "next/server";
import { z } from "zod";
import { booleanField, errorResponse, json, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z.object({
  featured: z.unknown()
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { container } = await requireAdmin(request);
    const { id } = await params;
    const input = updateSchema.parse(await request.json());
    const link = await container.toggleFeaturedSocialLink.execute(id, booleanField(input.featured));
    return json({ link });
  } catch (error) {
    return errorResponse(error, 400);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { container } = await requireAdmin(request);
    const { id } = await params;
    await container.removeSocialLink.execute(id);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
