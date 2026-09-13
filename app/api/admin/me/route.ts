import { NextRequest } from "next/server";
import { errorResponse, json, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { admin } = await requireAdmin(request);
    return json({ admin });
  } catch (error) {
    return errorResponse(error, 401);
  }
}
