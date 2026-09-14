import { NextRequest, NextResponse } from "next/server";
import { fileTypeFromBuffer } from "file-type";
import { createContainer } from "@/server/config/container";

export const accessCookie = "ves_access";
export const refreshCookie = "ves_refresh";
const maxUploadBytes = 100 * 1024 * 1024;

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, withNoStore(init));
}

export function errorResponse(error: unknown, status = 400) {
  const message = status >= 500 ? "Unexpected server error." : error instanceof Error ? error.message : "Unexpected request error.";
  return NextResponse.json({ error: message }, withNoStore({ status }));
}

function withNoStore(init?: ResponseInit): ResponseInit {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  headers.set("Pragma", "no-cache");
  headers.set("Expires", "0");
  return { ...init, headers };
}

export function logPublicRouteFailure(route: string, error: unknown) {
  console.warn(`[public-route:${route}] Returning safe fallback after route failed.`, error);
}

export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken?: string) {
  response.cookies.set(accessCookie, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 15
  });

  if (refreshToken) {
    response.cookies.set(refreshCookie, refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });
  }
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(accessCookie, "", { path: "/", maxAge: 0 });
  response.cookies.set(refreshCookie, "", { path: "/", maxAge: 0 });
}

export async function requireAdmin(request: NextRequest) {
  assertSameOrigin(request);
  const token = request.cookies.get(accessCookie)?.value ?? getBearerToken(request);
  if (!token) {
    throw new Error("Authentication required.");
  }

  const container = createContainer();
  const payload = container.tokens.verifyAccess(token);
  const admin = await container.getCurrentAdmin.execute(payload.adminId);
  return { admin, container };
}

export async function parseUploadForm(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  const altText = String(formData.get("altText") ?? "");

  if (!(file instanceof File)) {
    throw new Error("Upload field `file` is required.");
  }

  assertUploadSize(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  const mimeType = requireDetectedMime(detected?.mime);

  return {
    buffer,
    fileName: file.name,
    mimeType,
    altText
  };
}

export async function parseOptionalUploadForm(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  const fields = Object.fromEntries(
    [...formData.entries()]
      .filter(([key, value]) => key !== "file" && typeof value === "string")
      .map(([key, value]) => [key, value.toString()])
  );

  if (!(file instanceof File) || file.size === 0) {
    return { fields, file: undefined };
  }

  assertUploadSize(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);

  return {
    fields,
    file: {
      buffer,
      fileName: file.name,
      mimeType: requireDetectedMime(detected?.mime)
    }
  };
}

export async function parseNamedUploadForm(request: NextRequest, fileKeys: string[]) {
  const formData = await request.formData();
  const fields = Object.fromEntries(
    [...formData.entries()]
      .filter(([, value]) => typeof value === "string")
      .map(([key, value]) => [key, value.toString()])
  );
  const files: Record<string, { buffer: Buffer; fileName: string; mimeType: string } | undefined> = {};

  for (const key of fileKeys) {
    const file = formData.get(key);
    if (file instanceof File && file.size > 0) {
      assertUploadSize(file);
      const buffer = Buffer.from(await file.arrayBuffer());
      const detected = await fileTypeFromBuffer(buffer);
      files[key] = {
        buffer,
        fileName: file.name,
        mimeType: requireDetectedMime(detected?.mime)
      };
    }
  }

  return { fields, files };
}

export function booleanField(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "1";
}

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length);
}

export function assertSameOrigin(request: NextRequest) {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") {
    return;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return;
  }

  if (!getAllowedOrigins(request).has(origin)) {
    throw new Error("Cross-origin request blocked.");
  }
}

function getAllowedOrigins(request: NextRequest) {
  const origins = new Set([request.nextUrl.origin]);
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredSiteUrl) {
    try {
      origins.add(new URL(configuredSiteUrl).origin);
    } catch {}
  }

  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) {
    origins.add(`${forwardedProto}://${forwardedHost}`);
  }

  return origins;
}

function assertUploadSize(file: File) {
  if (file.size > maxUploadBytes) {
    throw new Error("Uploads must be 100MB or smaller.");
  }
}

function requireDetectedMime(mimeType?: string) {
  if (!mimeType) {
    throw new Error("Unable to verify uploaded file type.");
  }
  return mimeType;
}
