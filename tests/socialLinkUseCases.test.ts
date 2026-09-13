import { describe, expect, it } from "vitest";
import { AddSocialLinkUseCase, RemoveSocialLinkUseCase, ReorderSocialLinksUseCase, ToggleFeaturedSocialLinkUseCase } from "@/server/application/socialLinkUseCases";
import type { SocialLink, SocialPlatform } from "@/server/domain/entities";
import type { ISocialLinkRepository } from "@/server/domain/repositories";

class FakeSocialLinkRepository implements ISocialLinkRepository {
  records = new Map<string, SocialLink>();

  async list() {
    return [...this.records.values()];
  }

  async listFeatured() {
    return [...this.records.values()].filter((link) => link.featured);
  }

  async findById(id: string) {
    return this.records.get(id) ?? null;
  }

  async add(link: Omit<SocialLink, "id" | "createdAt">) {
    const record = { ...link, id: `social-${this.records.size + 1}`, createdAt: new Date() };
    this.records.set(record.id, record);
    return record;
  }

  async update(id: string, link: Partial<Omit<SocialLink, "id" | "createdAt">>) {
    const current = this.records.get(id);
    if (!current) {
      return null;
    }
    const saved = { ...current, ...link };
    this.records.set(id, saved);
    return saved;
  }

  async remove(id: string) {
    this.records.delete(id);
  }

  async findByPlatformAndUrl(platform: SocialPlatform, postUrl: string) {
    return [...this.records.values()].find((link) => link.platform === platform && link.postUrl === postUrl) ?? null;
  }

  async reorder(ids: string[]) {
    ids.forEach((id, index) => {
      const current = this.records.get(id);
      if (current) this.records.set(id, { ...current, sortOrder: index });
    });
    return this.list();
  }
}

describe("social link use cases", () => {
  it("adds instagram links", async () => {
    const repo = new FakeSocialLinkRepository();
    const link = await new AddSocialLinkUseCase(repo).execute({
      postUrl: "https://www.instagram.com/p/example/",
      featured: true
    });

    expect(link.featured).toBe(true);
    expect(link.platform).toBe("instagram");
    expect(link.sortOrder).toBeGreaterThan(0);
  });

  it("rejects unsupported URLs", async () => {
    const repo = new FakeSocialLinkRepository();
    await expect(
      new AddSocialLinkUseCase(repo).execute({
        postUrl: "https://example.com/posts/example"
      })
    ).rejects.toThrow("Use a public Instagram post/reel URL or LinkedIn post/update URL.");
  });

  it("toggles and removes links", async () => {
    const repo = new FakeSocialLinkRepository();
    const link = await repo.add({
      platform: "linkedin",
      postUrl: "https://linkedin.com/posts/example",
      featured: false,
      sortOrder: 10
    });

    const featured = await new ToggleFeaturedSocialLinkUseCase(repo).execute(link.id, true);
    expect(featured.featured).toBe(true);

    await new RemoveSocialLinkUseCase(repo).execute(link.id);
    expect(await repo.findById(link.id)).toBeNull();
  });

  it("reorders links", async () => {
    const repo = new FakeSocialLinkRepository();
    const first = await repo.add({ platform: "instagram", postUrl: "https://www.instagram.com/p/one/", featured: true, sortOrder: 0 });
    const second = await repo.add({ platform: "instagram", postUrl: "https://www.instagram.com/p/two/", featured: true, sortOrder: 1 });

    await new ReorderSocialLinksUseCase(repo).execute([second.id, first.id]);

    expect((await repo.findById(second.id))?.sortOrder).toBe(0);
    expect((await repo.findById(first.id))?.sortOrder).toBe(1);
  });
});
