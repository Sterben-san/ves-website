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
    const container = createContainer();
    const result = await loginWithBootstrap(container, input.email, input.password);
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

async function loginWithBootstrap(container: ReturnType<typeof createContainer>, email: string, password: string) {
  try {
    return await container.loginAdmin.execute(email, password);
  } catch (error) {
    const adminSeed = getMatchingSeedAdmin(email, password);
    if (!adminSeed) {
      throw error;
    }

    await container.admins.upsert({
      email: adminSeed.email,
      passwordHash: await container.passwords.hash(password),
      name: adminSeed.name,
      role: "admin"
    });

    return container.loginAdmin.execute(email, password);
  }
}

function getMatchingSeedAdmin(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const candidates = [
    {
      email: process.env.ADMIN_ONE_EMAIL?.toLowerCase().trim(),
      password: process.env.ADMIN_ONE_PASSWORD,
      name: "VES Admin"
    },
    {
      email: process.env.ADMIN_TWO_EMAIL?.toLowerCase().trim(),
      password: process.env.ADMIN_TWO_PASSWORD,
      name: "VES Operations"
    }
  ];

  return candidates.find(
    (candidate): candidate is { email: string; password: string; name: string } =>
      Boolean(candidate.email && candidate.password) && candidate.email === normalizedEmail && candidate.password === password
  );
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
