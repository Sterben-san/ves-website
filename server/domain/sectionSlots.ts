import type { SectionSlot } from "./entities";

export const sectionSlots: SectionSlot[] = [
  {
    sectionKey: "hero.bg",
    label: "Homepage hero video background",
    defaultMediaType: "video",
    defaultUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    defaultAltText: "Sample looping background video for the homepage hero",
    aspectRatio: 16 / 9,
    maxWidth: 1920,
    allowVideo: true
  },
  {
    sectionKey: "about.image",
    label: "About image",
    defaultMediaType: "image",
    defaultUrl: "/placeholders/about.svg",
    defaultAltText: "Engineers preparing rural lighting hardware",
    aspectRatio: 4 / 3,
    maxWidth: 1200
  },
  {
    sectionKey: "footer.logo",
    label: "Footer logo",
    defaultMediaType: "image",
    defaultUrl: "/brand/ves-logo-full.webp",
    defaultAltText: "VES Innovations logo"
  }
];

export const sectionSlotMap = new Map(sectionSlots.map((slot) => [slot.sectionKey, slot]));
