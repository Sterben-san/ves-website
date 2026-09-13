import { NextRequest } from "next/server";
import { z } from "zod";
import { booleanField, errorResponse, json, parseNamedUploadForm, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  kind: z.enum(["article", "video", "update"]),
  title: z.string().min(1),
  body: z.string().min(1),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  backgroundType: z.enum(["none", "image", "video"]).default("none"),
  overlayOpacity: z.coerce.number().min(0).max(1).default(0.5),
  textPosition: z.enum(["left", "center", "right"]).default("left"),
  pinned: z.unknown().optional(),
  published: z.unknown().optional()
});

const uploadKeys = ["backgroundFile", "posterFile", "mobileFallbackFile"];

export async function GET(request: NextRequest) {
  try {
    const { container } = await requireAdmin(request);
    const announcements = await container.listAllAnnouncementsForAdmin.execute();
    return json({ announcements });
  } catch (error) {
    return errorResponse(error, 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { admin, container } = await requireAdmin(request);
    const { fields, files } = await parseNamedUploadForm(request, uploadKeys);
    const input = schema.parse(fields);
    const announcement = await container.createAnnouncement.execute({
      ...input,
      pinned: booleanField(input.pinned),
      published: booleanField(input.published),
      authorId: admin.id,
      backgroundFile: files.backgroundFile,
      posterFile: files.posterFile,
      mobileFallbackFile: files.mobileFallbackFile
    });
    return json({ announcement }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
