import { NextRequest } from "next/server";
import { z } from "zod";
import { booleanField, errorResponse, json, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  postUrl: z.string().url(),
  caption: z.string().optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  featured: z.unknown().optional()
});

export async function GET(request: NextRequest) {
  try {
    const { container } = await requireAdmin(request);
    const links = await container.listSocialLinks.execute();
    return json({ links });
  } catch (error) {
    return errorResponse(error, 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { container } = await requireAdmin(request);
    const input = createSchema.parse(await request.json());
    const link = await container.addSocialLink.execute({
      postUrl: input.postUrl,
      caption: input.caption,
      thumbnailUrl: input.thumbnailUrl || undefined,
      featured: booleanField(input.featured)
    });
    return json({ link }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
