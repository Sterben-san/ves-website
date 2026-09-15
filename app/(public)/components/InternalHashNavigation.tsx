"use client";

import { useEffect } from "react";

function scrollToSection(targetId: string) {
  const target = document.getElementById(targetId);
  if (!target) return false;

  const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 80;
  const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
  window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
  return true;
}

function logHashNavigation(details: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") return;
  console.info("[hash-nav-validation]", JSON.stringify(details));
}

export function InternalHashNavigation() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || !url.hash) return;

      const targetId = decodeURIComponent(url.hash.slice(1));
      const samePath = url.pathname === window.location.pathname;
      const rootHashFromHome = window.location.pathname === "/" && url.pathname === "/";
      const targetFound = document.getElementById(targetId) !== null;

      logHashNavigation({
        href: anchor.getAttribute("href"),
        currentPath: window.location.pathname,
        targetPath: url.pathname,
        targetId,
        targetFound,
        samePath,
        scrollY: Math.round(window.scrollY)
      });

      if (!targetFound || (!samePath && !rootHashFromHome)) return;

      event.preventDefault();
      scrollToSection(targetId);
      window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
    };

    document.addEventListener("click", handleClick);

    if (window.location.hash) {
      const targetId = decodeURIComponent(window.location.hash.slice(1));
      window.requestAnimationFrame(() => scrollToSection(targetId));
    }

    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
