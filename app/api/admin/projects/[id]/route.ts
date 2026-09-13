import { NextRequest } from "next/server";
import { z } from "zod";
import { booleanField, errorResponse, json, parseOptionalUploadForm, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  summary: z.string().optional(),
  body: z.string().optional(),
  location: z.string().optional(),
  category: z.string().optional(),
  displayOrder: z.coerce.number().optional(),
  featured: z.unknown().optional(),
  published: z.unknown().optional(),
  removeCover: z.unknown().optional()
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { container } = await requireAdmin(request);
    const { id } = await params;
    const { fields, file } = await parseOptionalUploadForm(request);
    const input = schema.parse(fields);
    const project = await container.updateProject.execute(id, {
      ...input,
      featured: input.featured === undefined ? undefined : booleanField(input.featured),
      published: input.published === undefined ? undefined : booleanField(input.published),
      removeCover: booleanField(input.removeCover),
      file
    });
    return json({ project });
  } catch (error) {
    return errorResponse(error, 400);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { container } = await requireAdmin(request);
    const { id } = await params;
    await container.deleteProject.execute(id);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
