import { NextRequest } from "next/server";
import { z } from "zod";
import { booleanField, errorResponse, json, logAdminMutationFailure, parseOptionalUploadForm, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  issuer: z.string().min(1).optional(),
  description: z.string().optional(),
  issuedOn: z.string().optional(),
  displayOrder: z.coerce.number().optional(),
  published: z.unknown().optional()
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { container } = await requireAdmin(request);
    const { id } = await params;
    const { fields, file } = await parseOptionalUploadForm(request);
    const input = updateSchema.parse(fields);
    const certificate = await container.updateCertificate.execute(id, {
      ...input,
      published: input.published === undefined ? undefined : booleanField(input.published),
      file
    });
    return json({ certificate });
  } catch (error) {
    logAdminMutationFailure("certificates.update", error);
    return errorResponse(error, 400);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { container } = await requireAdmin(request);
    const { id } = await params;
    await container.deleteCertificate.execute(id);
    return json({ ok: true });
  } catch (error) {
    logAdminMutationFailure("certificates.delete", error);
    return errorResponse(error, 400);
  }
}
