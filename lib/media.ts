import { fallbackMedia } from "@/server/application/mediaUseCases";
import type { SectionMedia } from "@/server/domain/entities";
import { sectionSlots } from "@/server/domain/sectionSlots";
import { createContainer } from "@/server/config/container";

export type MediaMap = Record<string, SectionMedia>;

export async function getMediaMap(): Promise<MediaMap> {
  try {
    const media = await createContainer().listMedia.execute();
    return Object.fromEntries(media.map((item) => [item.sectionKey, item]));
  } catch {
    return Object.fromEntries(sectionSlots.map((slot) => [slot.sectionKey, fallbackMedia(slot.sectionKey)]));
  }
}

export function getMedia(media: MediaMap, sectionKey: string) {
  return media[sectionKey] ?? fallbackMedia(sectionKey);
}
