"use client";

import { useEffect, useRef, useState } from "react";
import type { SocialPlatform } from "@/server/domain/entities";

declare global {
  interface Window {
    instgrm?: { Embeds?: { process(): void } };
  }
}

export function SocialEmbed({ platform, postUrl, caption }: { platform: SocialPlatform; postUrl: string; caption?: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || platform !== "instagram") {
      return;
    }

    if (window.instgrm?.Embeds) {
      window.instgrm.Embeds.process();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onerror = () => setFallback(true);
    document.body.appendChild(script);
  }, [platform, visible]);

  useEffect(() => {
    if (!visible) return;
    const timeout = window.setTimeout(() => setFallback(true), 5000);
    return () => window.clearTimeout(timeout);
  }, [visible]);

  if (!visible) {
    return (
      <div className="min-h-[220px] overflow-hidden rounded bg-white p-4 shadow-soft" ref={hostRef}>
        <div className="h-52 animate-pulse rounded bg-ves-mist" />
        {caption ? <p className="mt-4 leading-7 text-ves-ink/70">{caption}</p> : null}
      </div>
    );
  }

  if (platform === "instagram") {
    return (
      <div className="overflow-hidden rounded bg-white p-4 shadow-soft" ref={hostRef}>
        <blockquote className="instagram-media" data-instgrm-permalink={postUrl} data-instgrm-version="14" />
        {fallback ? (
          <a className="focus-ring mt-4 block rounded bg-ves-mist p-4 font-extrabold text-ves-ink" href={postUrl} rel="noreferrer" target="_blank">
            Open Instagram Post
          </a>
        ) : null}
        {caption ? <p className="mt-4 leading-7 text-ves-ink/70">{caption}</p> : null}
      </div>
    );
  }

  const embedUrl = toLinkedInEmbedUrl(postUrl);
  return (
    <div className="overflow-hidden rounded bg-white p-4 shadow-soft" ref={hostRef}>
      {embedUrl ? (
        <iframe
          className="h-[420px] w-full border-0"
          src={embedUrl}
          title="LinkedIn post embed"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      ) : (
        <a className="focus-ring block rounded bg-ves-mist p-6 font-extrabold text-ves-ink" href={postUrl} rel="noreferrer" target="_blank">
          Open LinkedIn Post
        </a>
      )}
      {caption ? <p className="mt-4 leading-7 text-ves-ink/70">{caption}</p> : null}
    </div>
  );
}

function toLinkedInEmbedUrl(postUrl: string) {
  try {
    const url = new URL(postUrl);
    if (url.pathname.startsWith("/embed/feed/update/")) {
      return url.toString();
    }

    const decoded = decodeURIComponent(url.toString());
    const urnMatch = decoded.match(/urn:li:activity:(\d+)/);
    if (urnMatch) {
      return `https://www.linkedin.com/embed/feed/update/urn:li:activity:${urnMatch[1]}`;
    }

    const activityMatch = decoded.match(/activity-(\d+)/);
    if (activityMatch) {
      return `https://www.linkedin.com/embed/feed/update/urn:li:activity:${activityMatch[1]}`;
    }
  } catch {
    return null;
  }
  return null;
}
