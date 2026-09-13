import { describe, expect, it } from "vitest";
import { CreateAnnouncementUseCase, PinAnnouncementUseCase } from "@/server/application/announcementUseCases";
import type { Announcement, AnnouncementKind, StoredAsset } from "@/server/domain/entities";
import type { IAnnouncementRepository } from "@/server/domain/repositories";
import type { IStorageService } from "@/server/domain/services";

class FakeAnnouncementRepository implements IAnnouncementRepository {
  records = new Map<string, Announcement>();

  async list(kind?: AnnouncementKind) {
    return [...this.records.values()].filter((item) => !kind || item.kind === kind);
  }

  async listPublished(kind?: AnnouncementKind) {
    return [...this.records.values()].filter((item) => item.published && (!kind || item.kind === kind));
  }

  async findById(id: string) {
    return this.records.get(id) ?? null;
  }

  async findBySlug(slug: string) {
    return [...this.records.values()].find((item) => item.slug === slug) ?? null;
  }

  async findPinned() {
    return [...this.records.values()].find((item) => item.pinned && item.published) ?? null;
  }

  async create(input: Omit<Announcement, "id" | "createdAt" | "updatedAt">) {
    if (input.pinned) {
      this.records.forEach((item) => this.records.set(item.id, { ...item, pinned: false }));
    }
    const record = { ...input, id: `announcement-${this.records.size + 1}`, createdAt: new Date(), updatedAt: new Date() };
    this.records.set(record.id, record);
    return record;
  }

  async update(id: string, input: Partial<Omit<Announcement, "id" | "createdAt" | "updatedAt">>) {
    const current = this.records.get(id);
    if (!current) return null;
    if (input.pinned) {
      this.records.forEach((item) => {
        if (item.id !== id) this.records.set(item.id, { ...item, pinned: false });
      });
    }
    const saved = { ...current, ...input, updatedAt: new Date() };
    this.records.set(id, saved);
    return saved;
  }

  async delete(id: string) {
    this.records.delete(id);
  }

  async setPinned(id: string) {
    const current = this.records.get(id);
    if (!current) return null;
    this.records.forEach((item) => this.records.set(item.id, { ...item, pinned: item.id === id, published: item.id === id ? true : item.published }));
    return this.records.get(id) ?? null;
  }
}

class FakeStorage implements IStorageService {
  async upload(input: { mimeType: string; fileName: string }): Promise<StoredAsset> {
    const video = input.mimeType.startsWith("video/");
    return {
      mediaType: video ? "video" : "image",
      url: video ? `https://res.cloudinary.com/demo/video/upload/${input.fileName}` : `https://res.cloudinary.com/demo/image/upload/${input.fileName}`,
      publicId: input.fileName
    };
  }

  async delete(): Promise<void> {}
}

describe("announcement use cases", () => {
  it("generates unique slugs from titles", async () => {
    const repo = new FakeAnnouncementRepository();
    const create = new CreateAnnouncementUseCase(repo, new FakeStorage());

    const first = await create.execute({ kind: "update", title: "VES Field Update", body: "First", published: true, pinned: false, authorId: "admin" });
    const second = await create.execute({ kind: "article", title: "VES Field Update", body: "Second", published: true, pinned: false, authorId: "admin" });

    expect(first.slug).toBe("ves-field-update");
    expect(second.slug).toBe("ves-field-update-2");
  });

  it("keeps only one announcement pinned", async () => {
    const repo = new FakeAnnouncementRepository();
    const create = new CreateAnnouncementUseCase(repo, new FakeStorage());
    const first = await create.execute({ kind: "update", title: "First", body: "Body", published: true, pinned: true, authorId: "admin" });
    const second = await create.execute({ kind: "update", title: "Second", body: "Body", published: false, pinned: false, authorId: "admin" });

    await new PinAnnouncementUseCase(repo).execute(second.id);

    expect((await repo.findById(first.id))?.pinned).toBe(false);
    expect((await repo.findById(second.id))?.pinned).toBe(true);
    expect((await repo.findById(second.id))?.published).toBe(true);
  });

  it("creates a poster URL from video backgrounds", async () => {
    const repo = new FakeAnnouncementRepository();
    const announcement = await new CreateAnnouncementUseCase(repo, new FakeStorage()).execute({
      kind: "video",
      title: "Launch Video",
      body: "Watch the work.",
      backgroundType: "video",
      published: true,
      pinned: true,
      authorId: "admin",
      backgroundFile: {
        buffer: Buffer.from([1, 2, 3]),
        fileName: "launch.mp4",
        mimeType: "video/mp4"
      }
    });

    expect(announcement.backgroundType).toBe("video");
    expect(announcement.posterUrl).toContain("/video/upload/so_0,f_jpg,q_auto/");
    expect(announcement.posterUrl).toContain("launch.jpg");
  });
});
