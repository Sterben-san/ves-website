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

export const heroStatSectionCopies: Array<Omit<SectionCopy, "id" | "updatedAt">> = [
  {
    sectionKey: "home.stat.established",
    eyebrow: "Hero Stat",
    title: "Dec 2024",
    body: "Established",
    visible: true,
    theme: "dark",
    animationDirection: "right",
    animationSeconds: 46,
    maxItems: 1
  },
  {
    sectionKey: "home.stat.billReduction",
    eyebrow: "Hero Stat",
    title: "Up to 50%",
    body: "Electricity-bill reduction potential",
    visible: true,
    theme: "dark",
    animationDirection: "right",
    animationSeconds: 46,
    maxItems: 1
  },
  {
    sectionKey: "home.stat.controlUnit",
    eyebrow: "Hero Stat",
    title: "Rs. 3,800",
    body: "Control-unit cost model",
    visible: true,
    theme: "dark",
    animationDirection: "right",
    animationSeconds: 46,
    maxItems: 1
  },
  {
    sectionKey: "home.stat.warranty",
    eyebrow: "Hero Stat",
    title: "1 year",
    body: "Service warranty",
    visible: true,
    theme: "dark",
    animationDirection: "right",
    animationSeconds: 46,
    maxItems: 1
  }
];

export const heroStatSectionKeys = heroStatSectionCopies.map((copy) => copy.sectionKey);

export const editableSectionCopies: Array<Omit<SectionCopy, "id" | "updatedAt">> = [
  {
    sectionKey: "home.hero",
    eyebrow: "Streetlight Automation | Est. Dec 2024",
    title: "Innovating for a Sustainable Future",
    body: "Streetlight automation systems that conserve energy, reduce public costs, discourage illegal electricity usage, and enhance rural infrastructure.",
    ctaLabel: "Contact VES",
    ctaHref: "#contact",
    visible: true,
    theme: "dark",
    animationDirection: "right",
    animationSeconds: 46,
    maxItems: 8
  },
  ...heroStatSectionCopies,
  {
    sectionKey: "home.journey",
    eyebrow: "Field Process",
    title: "From municipal problem to installed automation.",
    body: "The VES process moves from site review and local approvals to manufacturing, installation, monitoring, and accountable support.",
    visible: true,
    theme: "light",
    animationDirection: "right",
    animationSeconds: 46,
    maxItems: 8
  },
  {
    sectionKey: "home.about",
    eyebrow: "About",
    title: "Practical infrastructure technology for local governments and rural communities",
    body: "VES was founded to solve a municipal problem observed directly in the field: streetlights running around the clock, wasting electricity, burning out hardware, and creating recurring repair costs for local bodies.",
    visible: true,
    theme: "dark",
    animationDirection: "right",
    animationSeconds: 46,
    maxItems: 8
  },
  {
    sectionKey: "home.certifications",
    eyebrow: "Certifications",
    title: "Verified records, quick to inspect.",
    body: "Tap any certificate preview to open the full certifications page at the matching record.",
    visible: true,
    theme: "green",
    animationDirection: "right",
    animationSeconds: 46,
    maxItems: 8
  },
  {
    sectionKey: "home.solutions",
    eyebrow: "Solutions & Field Work",
    title: "One operating story: what VES builds and where it works",
    body: "VES brings control boxes, streetlight automation, high mast lighting, and field support into one delivery model for government bodies, rural communities, sand reaches, roads, and consumer automation needs.",
    visible: true,
    theme: "light",
    animationDirection: "right",
    animationSeconds: 46,
    maxItems: 8
  },
  defaultNewsSectionCopy,
  {
    sectionKey: "home.companyModel",
    eyebrow: "Company Model",
    title: "Built as a practical public-infrastructure partner",
    body: "Automatic streetlight control, field installation, and long-term service support brought together for rural and district-level operating conditions.",
    visible: true,
    theme: "dark",
    animationDirection: "right",
    animationSeconds: 46,
    maxItems: 8
  },
  {
    sectionKey: "home.team",
    eyebrow: "Team",
    title: "Contact cards for the people behind VES",
    body: "Reach the active VES team for field projects, operations, development, and public-lighting conversations.",
    visible: true,
    theme: "light",
    animationDirection: "right",
    animationSeconds: 46,
    maxItems: 8
  },
  {
    sectionKey: "home.social",
    eyebrow: "Follow",
    title: "Follow VES public posts.",
    body: "Explore public Instagram and LinkedIn posts shared by the VES team.",
    visible: true,
    theme: "light",
    animationDirection: "right",
    animationSeconds: 46,
    maxItems: 4
  },
  {
    sectionKey: "home.contact",
    eyebrow: "Contact",
    title: "Evaluate streetlight automation with Vishwakarma",
    body: "Tell us about your streetlight cluster, village, road, sand reach, or public-lighting challenge and we will help evaluate control-box fit, deployment scope, and service support.",
    ctaLabel: "Contact VES",
    ctaHref: "mailto:vessolutions8328@gmail.com",
    visible: true,
    theme: "light",
    animationDirection: "right",
    animationSeconds: 46,
    maxItems: 8
  },
  {
    sectionKey: "home.internships",
    eyebrow: "Internships",
    title: "Active openings",
    body: "Current internship opportunities and application links published by the VES admin team.",
    ctaLabel: "Openings",
    ctaHref: "/internships",
    visible: true,
    theme: "dark",
    animationDirection: "right",
    animationSeconds: 46,
    maxItems: 2
  }
];

export const editableSectionCopyMap = new Map(editableSectionCopies.map((copy) => [copy.sectionKey, copy]));

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
  const fallback = editableSectionCopyMap.get(sectionKey);
  if (!fallback) {
    throw new Error(`Unknown section copy key: ${sectionKey}`);
  }
  return {
    ...fallback,
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
