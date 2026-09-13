import { describe, expect, it } from "vitest";
import { DeleteSectionMediaUseCase, ListMediaUseCase, UploadSectionMediaUseCase } from "@/server/application/mediaUseCases";
import type { SectionMedia, StoredAsset } from "@/server/domain/entities";
import type { IMediaRepository } from "@/server/domain/repositories";
import type { IStorageService } from "@/server/domain/services";

class FakeMediaRepository implements IMediaRepository {
  records = new Map<string, SectionMedia>();

  async list() {
    return [...this.records.values()];
  }

  async findBySectionKey(sectionKey: string) {
    return this.records.get(sectionKey) ?? null;
  }

  async upsert(media: Omit<SectionMedia, "id" | "updatedAt">) {
    const record = { ...media, id: media.sectionKey, updatedAt: new Date() };
    this.records.set(media.sectionKey, record);
    return record;
  }

  async delete(sectionKey: string) {
    this.records.delete(sectionKey);
  }
}

class FakeStorage implements IStorageService {
  deleted: string[] = [];

  async upload(): Promise<StoredAsset> {
    return {
      mediaType: "image",
      url: "https://cdn.example.com/new.webp",
      publicId: "new-id"
    };
  }

  async delete(publicId: string): Promise<void> {
    this.deleted.push(publicId);
  }
}

describe("media use cases", () => {
  it("fills missing slots with fallback media", async () => {
    const media = await new ListMediaUseCase(new FakeMediaRepository()).execute();
    expect(media).toHaveLength(3);
    expect(media.map((item) => item.sectionKey)).toEqual(["hero.bg", "about.image", "footer.logo"]);
    const hero = media.find((item) => item.sectionKey === "hero.bg");
    expect(hero?.mediaType).toBe("video");
    expect(hero?.url).toBe("https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4");
  });

  it("replaces existing media and deletes the old storage asset", async () => {
    const repo = new FakeMediaRepository();
    const storage = new FakeStorage();
    await repo.upsert({
      sectionKey: "hero.bg",
      mediaType: "image",
      url: "https://cdn.example.com/old.webp",
      publicId: "old-id",
      altText: "Old",
      uploadedBy: "admin"
    });

    const saved = await new UploadSectionMediaUseCase(repo, storage).execute({
      sectionKey: "hero.bg",
      buffer: Buffer.from([0, 1, 2]),
      fileName: "hero.webp",
      mimeType: "image/webp",
      altText: "Updated hero",
      uploadedBy: "admin"
    });

    expect(saved.url).toBe("https://cdn.example.com/new.webp");
    expect(storage.deleted).toEqual(["old-id"]);
  });

  it("rejects videos for image-only media slots", async () => {
    await expect(
      new UploadSectionMediaUseCase(new FakeMediaRepository(), new FakeStorage()).execute({
        sectionKey: "about.image",
        buffer: Buffer.from([0, 1, 2]),
        fileName: "about.mp4",
        mimeType: "video/mp4",
        altText: "About video",
        uploadedBy: "admin"
      })
    ).rejects.toThrow("About image accepts images only.");
  });

  it("deletes custom media and returns the fallback slot", async () => {
    const repo = new FakeMediaRepository();
    const storage = new FakeStorage();
    await repo.upsert({
      sectionKey: "about.image",
      mediaType: "image",
      url: "https://cdn.example.com/about.webp",
      publicId: "about-id",
      altText: "About",
      uploadedBy: "admin"
    });

    const fallback = await new DeleteSectionMediaUseCase(repo, storage).execute("about.image");
    expect(fallback.url).toBe("/placeholders/about.svg");
    expect(await repo.findBySectionKey("about.image")).toBeNull();
    expect(storage.deleted).toEqual(["about-id"]);
  });
});
