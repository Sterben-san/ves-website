import { NextRequest } from "next/server";
import { z } from "zod";
import { booleanField, errorResponse, json, parseOptionalUploadForm, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().optional(),
  applyUrl: z.string().optional(),
  applyEmail: z.string().email().optional().or(z.literal("")),
  active: z.unknown().optional()
});

export async function GET(request: NextRequest) {
  try {
    const { container } = await requireAdmin(request);
    const internships = await container.listAllInternshipsForAdmin.execute();
    return json({ internships });
  } catch (error) {
    return errorResponse(error, 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { admin, container } = await requireAdmin(request);
    const { fields, file } = await parseOptionalUploadForm(request);
    const input = createSchema.parse(fields);
    const internship = await container.createInternship.execute({
      title: input.title,
      description: input.description,
      location: input.location,
      applyUrl: input.applyUrl,
      applyEmail: input.applyEmail,
      active: input.active === undefined ? false : booleanField(input.active),
      postedBy: admin.id,
      file
    });
    return json({ internship }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
