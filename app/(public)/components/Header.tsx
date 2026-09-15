"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useState } from "react";

const links = [
  ["About", "/#about"],
  ["Certifications", "/certifications"],
  ["Work", "/#solutions"],
  ["Team", "/#team"],
  ["News", "/#news"],
  ["Internships", "/#internships"],
  ["Social", "/#social"],
  ["Contact", "/#contact"]
];

export function Header({
  showNews = false,
  showInternships = false,
  showCertifications = false,
  showSocial = true
}: {
  showNews?: boolean;
  showInternships?: boolean;
  showCertifications?: boolean;
  showSocial?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const visibleLinks = links.filter(
    ([label]) =>
      (label !== "News" || showNews) &&
      (label !== "Internships" || showInternships) &&
      (label !== "Certifications" || showCertifications) &&
      (label !== "Social" || showSocial)
  );

  const scrollToSection = (targetId: string) => {
    const target = document.getElementById(targetId);
    if (!target) return false;

    const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 80;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
    window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    return true;
  };

  const handleSectionClick = (event: MouseEvent<HTMLAnchorElement>, label: string, href: string) => {
    setOpen(false);

    if (!href.startsWith("/#")) return;

    const targetId = href.slice(2);
    const selector = `#${CSS.escape(targetId)}`;
    const targetCount = document.querySelectorAll(selector).length;
    const targetFound = targetCount > 0;

    if (process.env.NODE_ENV !== "production") {
      console.info("[header-nav-validation]", JSON.stringify({
        label,
        href,
        pathname,
        targetId,
        targetFound,
        targetCount,
        scrollY: Math.round(window.scrollY)
      }));
    }

    event.preventDefault();

    if (pathname === "/" && targetFound) {
      scrollToSection(targetId);
      window.history.pushState(null, "", `#${targetId}`);
      return;
    }

    router.push(href);
  };

  useEffect(() => {
    if (pathname !== "/" || !window.location.hash) return;

    const targetId = window.location.hash.slice(1);
    window.requestAnimationFrame(() => {
      scrollToSection(targetId);
    });
  }, [pathname]);

  return (
    <header className="sticky left-0 right-0 top-0 z-50 border-b border-ves-leaf/25 bg-[rgba(8,11,10,0.76)] text-ves-paper shadow-[0_10px_30px_rgba(8,11,10,0.24)] backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 sm:h-20 sm:gap-5 sm:px-6">
        <Link href="/" className="focus-ring flex items-center gap-3">
          <span className="relative grid h-10 w-10 shrink-0 place-items-center drop-shadow-[0_8px_18px_rgba(242,201,76,0.22)] sm:h-12 sm:w-12">
            <Image src="/brand/ves-logo-symbol-transparent.png" alt="VES Innovations logo" width={48} height={48} unoptimized className="h-full w-full object-contain" priority />
          </span>
          <span className="hidden text-sm font-medium leading-[1.12] text-ves-paper/90 sm:block">
            Vishwakarma Evolution
            <br />
            Solutions Pvt. Ltd.
          </span>
        </Link>
        <div className="hidden items-center gap-7 text-sm font-medium md:flex">
          {visibleLinks.map(([label, href]) => (
            <a
              className="focus-ring relative opacity-85 transition after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-ves-lime after:transition hover:text-ves-lime hover:after:scale-x-100"
              href={href}
              key={href}
              onClick={(event) => handleSectionClick(event, label, href)}
            >
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <a href="/admin/login" className="focus-ring hidden rounded bg-ves-leaf px-4 py-2 text-sm font-semibold text-white transition hover:bg-ves-lime hover:text-ves-black sm:inline-flex">
            Admin
          </a>
          <button
            className="focus-ring grid h-11 w-11 place-items-center rounded border border-ves-leaf/35 bg-ves-deep md:hidden"
            type="button"
            aria-expanded={open}
            aria-controls="ves-mobile-menu"
            aria-label="Open menu"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="grid gap-1">
              <span className="block h-0.5 w-5 rounded-full bg-ves-paper" />
              <span className="block h-0.5 w-5 rounded-full bg-ves-paper" />
              <span className="block h-0.5 w-5 rounded-full bg-ves-paper" />
            </span>
          </button>
        </div>
      </nav>
      <div id="ves-mobile-menu" className={`${open ? "block" : "hidden"} border-t border-ves-leaf/25 bg-[rgba(8,11,10,0.94)] px-4 pb-5 backdrop-blur-xl md:hidden`}>
        <div className="mx-auto grid max-w-[1200px] gap-1 pt-3">
          {visibleLinks.map(([label, href]) => (
            <a className="focus-ring rounded px-2 py-3 font-semibold" href={href} key={href} onClick={(event) => handleSectionClick(event, label, href)}>
              {label}
            </a>
          ))}
          <a className="focus-ring rounded bg-ves-lime px-4 py-3 text-center font-extrabold text-ves-black" href="/admin/login" onClick={() => setOpen(false)}>
            Admin
          </a>
        </div>
      </div>
    </header>
  );
}
