import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, json, logAdminMutationFailure, parseUploadForm, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ sectionKey: string }> }) {
  try {
    const { admin, container } = await requireAdmin(request);
    const upload = await parseUploadForm(request);
    const { sectionKey } = await params;
    const media = await container.uploadSectionMedia.execute({
      sectionKey: decodeURIComponent(sectionKey),
      uploadedBy: admin.id,
      ...upload
    });
    return json({ media });
  } catch (error) {
    const { sectionKey } = await params;
    logAdminMutationFailure("media.upload", error, { sectionKey: decodeURIComponent(sectionKey) });
    return errorResponse(error, 400);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ sectionKey: string }> }) {
  try {
    const { container } = await requireAdmin(request);
    const { sectionKey } = await params;
    const media = await container.deleteSectionMedia.execute(decodeURIComponent(sectionKey));
    return json({ media });
  } catch (error) {
    const { sectionKey } = await params;
    logAdminMutationFailure("media.delete", error, { sectionKey: decodeURIComponent(sectionKey) });
    return errorResponse(error, 400);
  }
}

const patchSchema = z.object({
  altText: z.string().min(1)
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ sectionKey: string }> }) {
  try {
    const { admin, container } = await requireAdmin(request);
    const { sectionKey } = await params;
    const input = patchSchema.parse(await request.json());
    const media = await container.updateSectionAltText.execute(decodeURIComponent(sectionKey), input.altText, admin.id);
    return json({ media });
  } catch (error) {
    const { sectionKey } = await params;
    logAdminMutationFailure("media.altText", error, { sectionKey: decodeURIComponent(sectionKey) });
    return errorResponse(error, 400);
  }
}
