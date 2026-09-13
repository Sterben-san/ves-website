import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createContainer } from "@/server/config/container";
import { assertSameOrigin, errorResponse, setAuthCookies } from "@/server/interfaces/http";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

declare global {
  var loginAttempts: Map<string, { count: number; resetAt: number }> | undefined;
}

const maxAttempts = 5;
const windowMs = 15 * 60 * 1000;
const attempts = globalThis.loginAttempts ?? new Map<string, { count: number; resetAt: number }>();
globalThis.loginAttempts = attempts;

export async function POST(request: NextRequest) {
  let email = "";
  const clientKey = clientIdentity(request);
  try {
    assertSameOrigin(request);
    const raw = await request.json();
    email = typeof raw?.email === "string" ? raw.email.toLowerCase().trim() : "";
    const rateKey = rateLimitKey(email, clientKey);
    if (isRateLimited(rateKey)) {
      return NextResponse.json({ error: "Too many attempts, try again later." }, { status: 429 });
    }

    const input = schema.parse(raw);
    const result = await createContainer().loginAdmin.execute(input.email, input.password);
    resetAttempts(rateLimitKey(input.email, clientKey));
    const response = NextResponse.json({ admin: result.admin });
    setAuthCookies(response, result.accessToken, result.refreshToken);
    return response;
  } catch (error) {
    recordFailedAttempt(rateLimitKey(email || "invalid-email", clientKey));
    if (error instanceof Error && error.message.startsWith("Missing required environment variable")) {
      return errorResponse(error, 503);
    }
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }
}

function isRateLimited(key: string) {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= maxAttempts;
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  attempts.set(key, { ...entry, count: entry.count + 1 });
}

function resetAttempts(key: string) {
  attempts.delete(key);
}

function rateLimitKey(email: string, clientKey: string) {
  return `${email.toLowerCase().trim() || "invalid-email"}:${clientKey}`;
}

function clientIdentity(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}
