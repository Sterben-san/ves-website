"use client";

export async function adminFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  if (response.status !== 401) {
    return response;
  }

  const refreshed = await fetch("/api/auth/refresh", { method: "POST" });
  if (!refreshed.ok) {
    return response;
  }

  return fetch(input, init);
}
