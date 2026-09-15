import { NextRequest } from "next/server";
import { z } from "zod";
import { booleanField, errorResponse, json, parseProjectUploadForm, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  summary: z.string().optional(),
  body: z.string().optional(),
  location: z.string().optional(),
  mapUrl: z.string().url().optional().or(z.literal("")),
  category: z.string().optional(),
  displayOrder: z.coerce.number().optional(),
  featured: z.unknown().optional(),
  published: z.unknown().optional(),
  removeCover: z.unknown().optional(),
  removeGalleryPublicIds: z.string().optional()
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { container } = await requireAdmin(request);
    const { id } = await params;
    const { fields, file, galleryFiles } = await parseProjectUploadForm(request);
    const input = schema.parse(fields);
    const removeGalleryPublicIds = parseGalleryRemoval(input.removeGalleryPublicIds);
    const project = await container.updateProject.execute(id, {
      ...input,
      mapUrl: input.mapUrl || undefined,
      featured: input.featured === undefined ? undefined : booleanField(input.featured),
      published: input.published === undefined ? undefined : booleanField(input.published),
      removeCover: booleanField(input.removeCover),
      file,
      galleryFiles,
      removeGalleryPublicIds
    });
    return json({ project });
  } catch (error) {
    return errorResponse(error, 400);
  }
}

function parseGalleryRemoval(value?: string) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
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
