import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin, clearAuthCookies, errorResponse } from "@/server/interfaces/http";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const response = NextResponse.json({ ok: true });
    clearAuthCookies(response);
    return response;
  } catch (error) {
    return errorResponse(error, 403);
  }
}
