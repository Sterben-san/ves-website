"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "./adminFetch";
import { QuickPostLauncher } from "./QuickPostLauncher";

type AdminProfile = {
  name: string;
  email: string;
};

export function AdminTopBar() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    adminFetch("/api/admin/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => setAdmin(body?.admin ?? null))
      .catch(() => setAdmin(null));
  }, []);

  async function logout() {
    setIsPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="flex min-h-16 flex-col items-stretch gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="min-w-0 pl-20 md:pl-0">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">VES CMS</p>
        <p className="truncate text-sm font-semibold text-slate-700">{admin ? `${admin.name} · ${admin.email}` : "Authenticated admin"}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
        <QuickPostLauncher />
        <button className="focus-ring rounded border border-slate-200 px-3 py-2 text-sm font-black text-slate-800 disabled:opacity-60 sm:px-4" disabled={isPending} onClick={logout}>
          {isPending ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </header>
  );
}
