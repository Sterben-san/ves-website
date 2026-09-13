import { describe, expect, it } from "vitest";
import { GetAdminHomepageSummaryUseCase } from "@/server/application/adminHomepageUseCases";
import type { Announcement, InternshipUpdate, SectionMedia, SocialLink } from "@/server/domain/entities";
import type { IAnnouncementRepository, IInternshipRepository, IMediaRepository, ISocialLinkRepository } from "@/server/domain/repositories";

class FakeAnnouncementRepository implements IAnnouncementRepository {
  constructor(private readonly records: Announcement[]) {}

  async list() {
    return this.records;
  }

  async listPublished() {
    return this.records.filter((item) => item.published);
  }

  async findById(id: string) {
    return this.records.find((item) => item.id === id) ?? null;
  }

  async findBySlug(slug: string) {
    return this.records.find((item) => item.slug === slug) ?? null;
  }

  async findPinned() {
    return this.records.find((item) => item.pinned && item.published) ?? null;
  }

  async create(input: Omit<Announcement, "id" | "createdAt" | "updatedAt">) {
    return { ...input, id: "created", createdAt: new Date(), updatedAt: new Date() };
  }

  async update() {
    return null;
  }

  async delete() {}

  async setPinned() {
    return null;
  }
}

class FakeInternshipRepository implements IInternshipRepository {
  constructor(private readonly records: InternshipUpdate[]) {}

  async listAll() {
    return this.records;
  }

  async listActive() {
    return this.records.filter((item) => item.active);
  }

  async findById(id: string) {
    return this.records.find((item) => item.id === id) ?? null;
  }

  async create(input: Omit<InternshipUpdate, "id" | "createdAt" | "updatedAt">) {
    return { ...input, id: "created", createdAt: new Date(), updatedAt: new Date() };
  }

  async update() {
    return null;
  }

  async delete() {}
}

class FakeSocialLinkRepository implements ISocialLinkRepository {
  constructor(private readonly records: SocialLink[]) {}

  async list() {
    return this.records;
  }

  async listFeatured() {
    return this.records.filter((item) => item.featured).slice(0, 4);
  }

  async findById(id: string) {
    return this.records.find((item) => item.id === id) ?? null;
  }

  async add(input: Omit<SocialLink, "id" | "createdAt">) {
    return { ...input, id: "created", createdAt: new Date() };
  }

  async update() {
    return null;
  }

  async remove() {}

  async findByPlatformAndUrl() {
    return null;
  }

  async reorder() {
    return this.records;
  }
}

class FakeMediaRepository implements IMediaRepository {
  constructor(private readonly records: SectionMedia[]) {}

  async list() {
    return this.records;
  }

  async findBySectionKey(sectionKey: string) {
    return this.records.find((item) => item.sectionKey === sectionKey) ?? null;
  }

  async upsert(input: Omit<SectionMedia, "id" | "updatedAt">) {
    return { ...input, id: input.sectionKey, updatedAt: new Date() };
  }

  async delete() {}
}

describe("admin homepage summary use case", () => {
  it("summarizes records that feed the public homepage", async () => {
    const pinned = announcement({ id: "a1", title: "Pinned", pinned: true, published: true });
    const summary = await new GetAdminHomepageSummaryUseCase(
      new FakeAnnouncementRepository([pinned, announcement({ id: "a2", title: "Draft", published: false })]),
      new FakeInternshipRepository([internship({ id: "i1", active: true }), internship({ id: "i2", active: false })]),
      new FakeSocialLinkRepository([social({ id: "s1", featured: true }), social({ id: "s2", featured: false })]),
      new FakeMediaRepository([
        media({ sectionKey: "hero.bg", url: "https://cdn.example.com/hero.webp", publicId: "hero-id" }),
        media({ sectionKey: "about.image", url: "/placeholders/about.svg", altText: "" })
      ])
    ).execute();

    expect(summary.pinnedAnnouncement?.id).toBe("a1");
    expect(summary.recentAnnouncements).toHaveLength(1);
    expect(summary.draftAnnouncementCount).toBe(1);
    expect(summary.activeInternshipCount).toBe(1);
    expect(summary.featuredSocialCount).toBe(1);
    expect(summary.customMediaSlotCount).toBe(1);
    expect(summary.missingAltTextSlots).toEqual(["about.image"]);
  });
});

function announcement(input: Partial<Announcement>): Announcement {
  return {
    id: "announcement",
    kind: "update",
    title: "Announcement",
    slug: "announcement",
    body: "Body",
    backgroundType: "none",
    overlayOpacity: 0.5,
    textPosition: "left",
    pinned: false,
    published: true,
    authorId: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...input
  };
}

function internship(input: Partial<InternshipUpdate>): InternshipUpdate {
  return {
    id: "internship",
    title: "Internship",
    description: "Description",
    active: true,
    postedBy: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...input
  };
}

function social(input: Partial<SocialLink>): SocialLink {
  return {
    id: "social",
    platform: "instagram",
    postUrl: "https://www.instagram.com/p/example/",
    featured: false,
    sortOrder: 0,
    createdAt: new Date(),
    ...input
  };
}

function media(input: Partial<SectionMedia>): SectionMedia {
  return {
    id: input.sectionKey ?? "hero.bg",
    sectionKey: "hero.bg",
    mediaType: "image",
    url: "/placeholders/hero-bg.svg",
    publicId: "",
    altText: "Alt text",
    updatedAt: new Date(),
    ...input
  };
}
