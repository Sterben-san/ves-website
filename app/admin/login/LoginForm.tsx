"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    setError("");
    setIsPending(true);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password")
        })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "" }));
        setError(response.status === 429 ? body.error || "Too many attempts, try again later." : "Incorrect email or password.");
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Unable to sign in. Check your connection and try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="mt-7 grid gap-4" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm font-bold">
        Email
        <input
          className="focus-ring rounded border border-ves-ink/20 px-4 py-3 font-medium"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Password
        <input
          className="focus-ring rounded border border-ves-ink/20 px-4 py-3 font-medium"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {error ? (
        <p className="rounded bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" aria-live="polite">
          {error}
        </p>
      ) : null}
      <button className="focus-ring inline-flex items-center justify-center gap-2 rounded bg-ves-ink px-5 py-3 font-black text-white disabled:opacity-60" disabled={isPending}>
        {isPending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" aria-hidden="true" /> : null}
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
