"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Announcement } from "@/server/domain/entities";

export function AnnouncementHero({ announcement }: { announcement: Announcement }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      setReduceMotion(motionQuery.matches);
      setMobile(mobileQuery.matches);
    };
    sync();
    motionQuery.addEventListener("change", sync);
    mobileQuery.addEventListener("change", sync);
    return () => {
      motionQuery.removeEventListener("change", sync);
      mobileQuery.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, [announcement.id]);

  const staticUrl = mobile ? announcement.mobileFallbackUrl || announcement.posterUrl || announcement.backgroundUrl : announcement.posterUrl || announcement.backgroundUrl;
  const showVideo = announcement.backgroundType === "video" && announcement.backgroundUrl && !reduceMotion && !mobile;

  return (
    <section className="relative min-h-[70vh] overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0">
        {showVideo ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={announcement.posterUrl}
            className="h-full w-full object-cover"
            aria-hidden="true"
          >
            <source src={announcement.backgroundUrl} />
          </video>
        ) : staticUrl ? (
          <Image src={staticUrl} alt="" fill className="object-cover" aria-hidden="true" priority />
        ) : null}
        <div className="absolute inset-0 bg-black" style={{ opacity: announcement.overlayOpacity }} aria-hidden="true" />
      </div>
      <div className={`section-shell relative z-10 flex min-h-[70vh] items-center ${positionClass(announcement.textPosition)}`}>
        <div className={`max-w-2xl ${announcement.textPosition === "center" ? "text-center" : announcement.textPosition === "right" ? "text-right" : ""}`}>
          <p className="eyebrow text-ves-lime">{announcement.kind}</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.06] md:text-6xl">{announcement.title}</h1>
          <p className="mt-6 whitespace-pre-wrap text-lg leading-8 text-white/85">{announcement.body}</p>
          {announcement.ctaHref && announcement.ctaLabel ? (
            <a className="focus-ring mt-8 inline-block rounded bg-ves-lime px-6 py-4 font-extrabold text-ves-ink" href={announcement.ctaHref}>
              {announcement.ctaLabel}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function positionClass(position: Announcement["textPosition"]) {
  if (position === "center") return "justify-center";
  if (position === "right") return "justify-end";
  return "justify-start";
}
