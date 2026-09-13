import type { SectionCopy } from "@/server/domain/entities";
import type { ISectionCopyRepository } from "@/server/domain/repositories";

export const defaultNewsSectionCopy: Omit<SectionCopy, "id" | "updatedAt"> = {
  sectionKey: "home.news",
  eyebrow: "News",
  title: "Updates, milestones, and field notes.",
  body: "Published articles, photos, videos, and company milestones from the admin dashboard appear here automatically.",
  ctaLabel: "View All News",
  ctaHref: "/news",
  visible: true,
  theme: "dark",
  animationDirection: "right",
  animationSeconds: 46,
  maxItems: 8
};

export class GetSectionCopyUseCase {
  constructor(private readonly sectionCopy: ISectionCopyRepository) {}

  async execute(sectionKey: string) {
    const saved = await this.sectionCopy.findBySectionKey(sectionKey);
    return saved ?? fallbackSectionCopy(sectionKey);
  }
}

export class UpdateSectionCopyUseCase {
  constructor(private readonly sectionCopy: ISectionCopyRepository) {}

  async execute(input: SectionCopyInput) {
    const fallback = fallbackSectionCopy(input.sectionKey);
    return this.sectionCopy.upsert({
      sectionKey: input.sectionKey,
      eyebrow: required(input.eyebrow ?? fallback.eyebrow, "Eyebrow"),
      title: required(input.title ?? fallback.title, "Title"),
      body: required(input.body ?? fallback.body, "Body"),
      ctaLabel: optional(input.ctaLabel ?? fallback.ctaLabel),
      ctaHref: optional(input.ctaHref ?? fallback.ctaHref),
      visible: input.visible ?? fallback.visible,
      theme: input.theme ?? fallback.theme,
      animationDirection: input.animationDirection ?? fallback.animationDirection,
      animationSeconds: clampNumber(input.animationSeconds ?? fallback.animationSeconds, 18, 120),
      maxItems: clampNumber(input.maxItems ?? fallback.maxItems, 1, 16)
    });
  }
}

export type SectionCopyInput = {
  sectionKey: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  visible?: boolean;
  theme?: SectionCopy["theme"];
  animationDirection?: SectionCopy["animationDirection"];
  animationSeconds?: number;
  maxItems?: number;
};

function fallbackSectionCopy(sectionKey: string): SectionCopy {
  if (sectionKey !== defaultNewsSectionCopy.sectionKey) {
    throw new Error(`Unknown section copy key: ${sectionKey}`);
  }
  return {
    ...defaultNewsSectionCopy,
    id: sectionKey,
    updatedAt: new Date(0)
  };
}

function required(value: string, label: string) {
  const cleaned = value.trim();
  if (!cleaned) throw new Error(`${label} is required.`);
  return cleaned;
}

function optional(value?: string) {
  const cleaned = value?.trim();
  return cleaned || undefined;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}
