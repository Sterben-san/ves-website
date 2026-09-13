import { NextRequest } from "next/server";
import { errorResponse, json, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { container } = await requireAdmin(request);
    const steps = await container.listFieldProcessStepsForAdmin.execute();
    return json({ steps });
  } catch (error) {
    return errorResponse(error, 401);
  }
}
