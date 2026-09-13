import { NextRequest } from "next/server";
import { z } from "zod";
import { booleanField, errorResponse, json, parseOptionalUploadForm, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  kind: z.enum(["article", "photo", "milestone"]),
  title: z.string().optional(),
  summary: z.string().optional(),
  body: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  imagePublicId: z.string().optional(),
  linkLabel: z.string().optional(),
  linkHref: z.string().optional(),
  displayOrder: z.coerce.number().optional(),
  published: z.unknown().optional()
});

export async function GET(request: NextRequest) {
  try {
    const { container } = await requireAdmin(request);
    const items = await container.listAllHomepageNewsForAdmin.execute();
    return json({ items });
  } catch (error) {
    return errorResponse(error, 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { container } = await requireAdmin(request);
    const { fields, file } = await parseOptionalUploadForm(request);
    const input = schema.parse(fields);
    const item = await container.createHomepageNews.execute({
      ...input,
      imageUrl: input.imageUrl || undefined,
      linkHref: input.linkHref || undefined,
      published: booleanField(input.published),
      file
    });
    return json({ item }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
