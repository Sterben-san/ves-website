import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, json, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  eyebrow: z.string().min(1).max(40),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(260),
  ctaLabel: z.string().max(40).optional(),
  ctaHref: z.string().max(200).optional(),
  visible: z.boolean().optional(),
  theme: z.enum(["dark", "light", "green"]).optional(),
  animationDirection: z.enum(["left", "right"]).optional(),
  animationSeconds: z.coerce.number().int().min(18).max(120).optional(),
  maxItems: z.coerce.number().int().min(1).max(16).optional()
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ sectionKey: string }> }) {
  try {
    const { container } = await requireAdmin(request);
    const { sectionKey } = await params;
    const input = schema.parse(await request.json());
    const copy = await container.updateSectionCopy.execute({
      sectionKey: decodeURIComponent(sectionKey),
      ...input
    });
    return json({ copy });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
