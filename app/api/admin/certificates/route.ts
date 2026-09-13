import { NextRequest } from "next/server";
import { z } from "zod";
import { booleanField, errorResponse, json, parseOptionalUploadForm, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().min(1),
  issuer: z.string().min(1),
  description: z.string().optional(),
  issuedOn: z.string().optional(),
  displayOrder: z.coerce.number().optional(),
  published: z.unknown().optional()
});

export async function GET(request: NextRequest) {
  try {
    const { container } = await requireAdmin(request);
    const certificates = await container.listAllCertificatesForAdmin.execute();
    return json({ certificates });
  } catch (error) {
    return errorResponse(error, 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { container } = await requireAdmin(request);
    const { fields, file } = await parseOptionalUploadForm(request);
    if (!file) {
      throw new Error("Certificate PDF is required.");
    }
    const input = createSchema.parse(fields);
    const certificate = await container.createCertificate.execute({
      ...input,
      published: input.published === undefined ? true : booleanField(input.published),
      file
    });
    return json({ certificate }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
