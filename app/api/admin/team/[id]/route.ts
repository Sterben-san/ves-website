import { NextRequest } from "next/server";
import { z } from "zod";
import { booleanField, errorResponse, json, parseOptionalUploadForm, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  fullName: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  bio: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  socials: z.string().optional(),
  displayOrder: z.coerce.number().optional(),
  active: z.unknown().optional(),
  removePhoto: z.unknown().optional()
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { container } = await requireAdmin(request);
    const { id } = await params;
    const { fields, file } = await parseOptionalUploadForm(request);
    const input = schema.parse(fields);
    const member = await container.updateTeamMember.execute(id, {
      ...input,
      active: input.active === undefined ? undefined : booleanField(input.active),
      removePhoto: booleanField(input.removePhoto),
      file
    });
    return json({ member });
  } catch (error) {
    return errorResponse(error, 400);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { container } = await requireAdmin(request);
    const { id } = await params;
    await container.deleteTeamMember.execute(id);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
