"use client";

import { useEffect, useState } from "react";
import type { SectionMedia } from "@/server/domain/entities";

export function HeroBackgroundPlayer({ media }: { media: SectionMedia }) {
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    let active = true;
    void import("media-chrome").then(() => {
      if (active) {
        setPlayerReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (media.mediaType !== "video") {
    return (
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${media.url})` }}
        aria-label={media.altText}
      />
    );
  }

  const video = (
    <video
      slot={playerReady ? "media" : undefined}
      className="h-full w-full object-cover"
      src={media.url}
      aria-label={media.altText}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
    />
  );

  if (!playerReady) {
    return <div className="absolute inset-0">{video}</div>;
  }

  return (
    <media-controller className="absolute inset-0 block h-full w-full" nohotkeys>
      {video}
    </media-controller>
  );
}
