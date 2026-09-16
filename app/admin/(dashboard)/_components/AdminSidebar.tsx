"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/admin/dashboard", label: "Overview", short: "O", exact: true },
  { href: "/admin/dashboard/media", label: "Section Media", short: "M" },
  { href: "/admin/dashboard/about", label: "About Section", short: "B" },
  { href: "/admin/dashboard/homepage-news", label: "Homepage News", short: "N" },
  { href: "/admin/dashboard/announcements", label: "Announcements", short: "A" },
  { href: "/admin/dashboard/internships", label: "Internships", short: "I" },
  { href: "/admin/dashboard/projects", label: "Projects", short: "P" },
  { href: "/admin/dashboard/certificates", label: "Certificates", short: "C" },
  { href: "/admin/dashboard/field-process", label: "Field Process", short: "F" },
  { href: "/admin/dashboard/team", label: "Team Contact Cards", short: "T" },
  { href: "/admin/dashboard/social", label: "Social Links", short: "S" }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="focus-ring fixed left-3 top-3 z-[60] rounded bg-slate-900 px-3 py-2 text-sm font-black text-white shadow-lg md:hidden"
        onClick={() => setOpen(true)}
      >
        Menu
      </button>
      <div className={`${open ? "fixed inset-0 z-50 bg-slate-950/50 md:hidden" : "hidden"}`} onClick={() => setOpen(false)} />
      <aside
        className={`fixed inset-y-0 left-0 z-[55] w-[min(18rem,82vw)] bg-slate-900 text-white transition-transform duration-150 md:translate-x-0 lg:w-60 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:w-64 lg:translate-x-0`}
      >
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center justify-between gap-3">
            <Link className="focus-ring flex items-center gap-3" href="/">
              <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded bg-white p-1">
                <Image src="/brand/ves-logo-mark.webp" alt="VES Innovations logo" width={34} height={34} className="h-full w-full object-contain" />
              </span>
              <span className="font-black md:block">Admin</span>
            </Link>
            <button className="focus-ring rounded px-2 py-1 md:hidden" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          <nav className="mt-8 grid gap-2">
            {navItems.map((item) => {
              const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  className={`focus-ring flex items-center gap-3 rounded px-3 py-3 text-sm font-black transition ${
                    active ? "bg-ves-lime text-slate-950" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                  href={item.href}
                  key={item.href}
                  onClick={() => setOpen(false)}
                >
                  <span className="grid h-7 w-7 place-items-center rounded bg-white/10">{item.short}</span>
                  <span className="md:block">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
