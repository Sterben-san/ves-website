import { NextRequest } from "next/server";
import { errorResponse, json, requireAdmin } from "@/server/interfaces/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { container } = await requireAdmin(request);
    const { id } = await params;
    const announcement = await container.pinAnnouncement.execute(id);
    return json({ announcement });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
