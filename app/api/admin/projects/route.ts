import { NextRequest } from "next/server";
import { z } from "zod";
import { booleanField, errorResponse, json, parseOptionalUploadForm, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  summary: z.string().optional(),
  body: z.string().optional(),
  location: z.string().optional(),
  category: z.string().optional(),
  coverUrl: z.string().url().optional().or(z.literal("")),
  coverPublicId: z.string().optional(),
  displayOrder: z.coerce.number().optional(),
  featured: z.unknown().optional(),
  published: z.unknown().optional()
});

export async function GET(request: NextRequest) {
  try {
    const { container } = await requireAdmin(request);
    const projects = await container.listAllProjectsForAdmin.execute();
    return json({ projects });
  } catch (error) {
    return errorResponse(error, 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { container } = await requireAdmin(request);
    const { fields, file } = await parseOptionalUploadForm(request);
    const input = schema.parse(fields);
    const project = await container.createProject.execute({
      ...input,
      coverUrl: input.coverUrl || undefined,
      featured: booleanField(input.featured),
      published: booleanField(input.published),
      file
    });
    return json({ project }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
