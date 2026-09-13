import { NextRequest } from "next/server";
import { z } from "zod";
import { booleanField, errorResponse, json, parseOptionalUploadForm, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  kind: z.enum(["article", "photo", "milestone"]).optional(),
  title: z.string().optional(),
  summary: z.string().optional(),
  body: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  imagePublicId: z.string().optional(),
  linkLabel: z.string().optional(),
  linkHref: z.string().optional(),
  displayOrder: z.coerce.number().optional(),
  published: z.unknown().optional(),
  removeImage: z.unknown().optional()
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { container } = await requireAdmin(request);
    const { fields, file } = await parseOptionalUploadForm(request);
    const input = schema.parse(fields);
    const item = await container.updateHomepageNews.execute(id, {
      ...input,
      imageUrl: input.imageUrl || undefined,
      linkHref: input.linkHref || undefined,
      published: input.published === undefined ? undefined : booleanField(input.published),
      removeImage: booleanField(input.removeImage),
      file
    });
    return json({ item });
  } catch (error) {
    return errorResponse(error, 400);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { container } = await requireAdmin(request);
    await container.deleteHomepageNews.execute(id);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
