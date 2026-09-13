import { NextRequest } from "next/server";
import { z } from "zod";
import { booleanField, errorResponse, json, parseOptionalUploadForm, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  fullName: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  linkedinUrl: z.string().url(),
  socials: z.string().optional(),
  displayOrder: z.coerce.number().optional(),
  active: z.unknown().optional()
});

export async function GET(request: NextRequest) {
  try {
    const { container } = await requireAdmin(request);
    const members = await container.listAllTeamMembersForAdmin.execute();
    return json({ members });
  } catch (error) {
    return errorResponse(error, 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { container } = await requireAdmin(request);
    const { fields, file } = await parseOptionalUploadForm(request);
    const input = schema.parse(fields);
    const member = await container.createTeamMember.execute({
      ...input,
      active: input.active === undefined ? true : booleanField(input.active),
      file
    });
    return json({ member }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
