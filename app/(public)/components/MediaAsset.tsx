import Image from "next/image";
import type { SectionMedia } from "@/server/domain/entities";

export function MediaAsset({
  media,
  className,
  priority = false
}: {
  media: SectionMedia;
  className?: string;
  priority?: boolean;
}) {
  if (media.mediaType === "video") {
    return (
      <video className={className} src={media.url} aria-label={media.altText} autoPlay muted loop playsInline />
    );
  }

  return <Image className={className} src={media.url} alt={media.altText} fill priority={priority} sizes="100vw" />;
}
