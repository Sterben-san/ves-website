import { describe, expect, it } from "vitest";
import { CreateHomepageNewsUseCase, DeleteHomepageNewsUseCase, ListPublishedHomepageNewsUseCase, ReorderHomepageNewsUseCase, UpdateHomepageNewsUseCase } from "@/server/application/homepageNewsUseCases";
import type { HomepageNewsItem, StoredAsset } from "@/server/domain/entities";
import type { IHomepageNewsRepository } from "@/server/domain/repositories";
import type { IStorageService } from "@/server/domain/services";

class FakeHomepageNewsRepository implements IHomepageNewsRepository {
  records = new Map<string, HomepageNewsItem>();

  async list() {
    return [...this.records.values()].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async listPublished() {
    return (await this.list()).filter((item) => item.published && item.title && item.summary);
  }

  async findById(id: string) {
    return this.records.get(id) ?? null;
  }

  async create(item: Omit<HomepageNewsItem, "id" | "createdAt" | "updatedAt">) {
    const now = new Date();
    const record = { ...item, id: `homepage-news-${this.records.size + 1}`, createdAt: now, updatedAt: now };
    this.records.set(record.id, record);
    return record;
  }

  async update(id: string, item: Partial<Omit<HomepageNewsItem, "id" | "createdAt" | "updatedAt">>) {
    const current = this.records.get(id);
    if (!current) return null;
    const saved = { ...current, ...item, updatedAt: new Date() };
    this.records.set(id, saved);
    return saved;
  }

  async delete(id: string) {
    this.records.delete(id);
  }

  async reorder(ids: string[]) {
    ids.forEach((id, index) => {
      const current = this.records.get(id);
      if (current) this.records.set(id, { ...current, displayOrder: index });
    });
    return this.list();
  }
}

class FakeStorage implements IStorageService {
  deleted: string[] = [];

  async upload(): Promise<StoredAsset> {
    return { mediaType: "image", url: "https://res.cloudinary.com/demo/image/upload/news.jpg", publicId: "homepage-news-image" };
  }

  async delete(publicId: string) {
    this.deleted.push(publicId);
  }
}

const completeItem = {
  kind: "milestone" as const,
  title: "TSMDC high mast milestone",
  summary: "Large-area lighting reached a field milestone.",
  published: true
};

describe("homepage news use cases", () => {
  it("creates independently published homepage news cards", async () => {
    const repo = new FakeHomepageNewsRepository();
    const item = await new CreateHomepageNewsUseCase(repo, new FakeStorage()).execute(completeItem);

    expect(item.published).toBe(true);
    expect(await new ListPublishedHomepageNewsUseCase(repo).execute()).toHaveLength(1);
  });

  it("keeps incomplete cards hidden even when publish is requested", async () => {
    const repo = new FakeHomepageNewsRepository();
    const item = await new CreateHomepageNewsUseCase(repo, new FakeStorage()).execute({
      kind: "photo",
      title: "Draft",
      published: true
    });

    expect(item.published).toBe(false);
    expect(await new ListPublishedHomepageNewsUseCase(repo).execute()).toEqual([]);
  });

  it("auto-hides a card if required text is cleared", async () => {
    const repo = new FakeHomepageNewsRepository();
    const created = await new CreateHomepageNewsUseCase(repo, new FakeStorage()).execute(completeItem);
    const updated = await new UpdateHomepageNewsUseCase(repo, new FakeStorage()).execute(created.id, { summary: "" });

    expect(updated.published).toBe(false);
  });

  it("uploads and deletes card images", async () => {
    const repo = new FakeHomepageNewsRepository();
    const storage = new FakeStorage();
    const created = await new CreateHomepageNewsUseCase(repo, storage).execute({
      ...completeItem,
      file: { buffer: Buffer.from([1, 2, 3]), fileName: "news.jpg", mimeType: "image/jpeg" }
    });

    expect(created.imagePublicId).toBe("homepage-news-image");

    await new DeleteHomepageNewsUseCase(repo, storage).execute(created.id);
    expect(await repo.findById(created.id)).toBeNull();
    expect(storage.deleted).toEqual(["homepage-news-image"]);
  });

  it("reorders homepage news cards", async () => {
    const repo = new FakeHomepageNewsRepository();
    const first = await repo.create({ ...completeItem, displayOrder: 0 });
    const second = await repo.create({ ...completeItem, title: "Second", displayOrder: 1 });

    await new ReorderHomepageNewsUseCase(repo).execute([second.id, first.id]);

    expect((await repo.findById(second.id))?.displayOrder).toBe(0);
    expect((await repo.findById(first.id))?.displayOrder).toBe(1);
  });
});
