import { NextRequest } from "next/server";
import { z } from "zod";
import { booleanField, errorResponse, json, parseNamedUploadForm, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  kind: z.enum(["article", "video", "update"]).optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  backgroundType: z.enum(["none", "image", "video"]).optional(),
  overlayOpacity: z.coerce.number().min(0).max(1).optional(),
  textPosition: z.enum(["left", "center", "right"]).optional(),
  pinned: z.unknown().optional(),
  published: z.unknown().optional()
});

const uploadKeys = ["backgroundFile", "posterFile", "mobileFallbackFile"];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { container } = await requireAdmin(request);
    const { id } = await params;
    const { fields, files } = await parseNamedUploadForm(request, uploadKeys);
    const input = schema.parse(fields);
    const announcement = await container.updateAnnouncement.execute(id, {
      ...input,
      pinned: input.pinned === undefined ? undefined : booleanField(input.pinned),
      published: input.published === undefined ? undefined : booleanField(input.published),
      backgroundFile: files.backgroundFile,
      posterFile: files.posterFile,
      mobileFallbackFile: files.mobileFallbackFile
    });
    return json({ announcement });
  } catch (error) {
    return errorResponse(error, 400);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { container } = await requireAdmin(request);
    const { id } = await params;
    await container.deleteAnnouncement.execute(id);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
