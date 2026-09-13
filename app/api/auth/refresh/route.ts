import { NextRequest, NextResponse } from "next/server";
import { createContainer } from "@/server/config/container";
import { assertSameOrigin, errorResponse, refreshCookie, setAuthCookies } from "@/server/interfaces/http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const refreshToken = request.cookies.get(refreshCookie)?.value;
    if (!refreshToken) {
      throw new Error("Refresh token missing.");
    }

    const result = await createContainer().refreshAdminSession.execute(refreshToken);
    const response = NextResponse.json({ admin: result.admin });
    setAuthCookies(response, result.accessToken);
    return response;
  } catch (error) {
    return errorResponse(error, 401);
  }
}
