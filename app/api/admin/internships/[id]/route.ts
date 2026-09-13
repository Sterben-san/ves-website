import { NextRequest } from "next/server";
import { z } from "zod";
import { booleanField, errorResponse, json, parseOptionalUploadForm, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  applyUrl: z.string().optional(),
  applyEmail: z.string().email().optional().or(z.literal("")),
  active: z.unknown().optional(),
  removeAttachment: z.unknown().optional()
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { container } = await requireAdmin(request);
    const { id } = await params;
    const { fields, file } = await parseOptionalUploadForm(request);
    const input = updateSchema.parse(fields);
    const internship = await container.updateInternship.execute(id, {
      title: input.title,
      description: input.description,
      location: input.location,
      applyUrl: input.applyUrl,
      applyEmail: input.applyEmail,
      active: input.active === undefined ? undefined : booleanField(input.active),
      removeAttachment: booleanField(input.removeAttachment),
      file
    });
    return json({ internship });
  } catch (error) {
    return errorResponse(error, 400);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { container } = await requireAdmin(request);
    const { id } = await params;
    await container.deleteInternship.execute(id);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
