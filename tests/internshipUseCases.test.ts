import { describe, expect, it } from "vitest";
import { CreateInternshipUseCase, DeleteInternshipUseCase, UpdateInternshipUseCase } from "@/server/application/internshipUseCases";
import type { InternshipUpdate, StoredAsset } from "@/server/domain/entities";
import type { IInternshipRepository } from "@/server/domain/repositories";
import type { IStorageService } from "@/server/domain/services";

class FakeInternshipRepository implements IInternshipRepository {
  records = new Map<string, InternshipUpdate>();

  async listAll() {
    return [...this.records.values()];
  }

  async listActive() {
    return [...this.records.values()].filter((item) => item.active);
  }

  async findById(id: string) {
    return this.records.get(id) ?? null;
  }

  async create(update: Omit<InternshipUpdate, "id" | "createdAt" | "updatedAt">) {
    const now = new Date();
    const record = { ...update, id: `intern-${this.records.size + 1}`, createdAt: now, updatedAt: now };
    this.records.set(record.id, record);
    return record;
  }

  async update(id: string, update: Partial<Omit<InternshipUpdate, "id" | "createdAt" | "updatedAt">>) {
    const current = this.records.get(id);
    if (!current) {
      return null;
    }
    const saved = { ...current, ...update, updatedAt: new Date() };
    this.records.set(id, saved);
    return saved;
  }

  async delete(id: string) {
    this.records.delete(id);
  }
}

class FakeStorage implements IStorageService {
  deleted: string[] = [];

  async upload(): Promise<StoredAsset> {
    return { mediaType: "raw", url: "https://cdn.example.com/internship.pdf", publicId: "pdf-id" };
  }

  async delete(publicId: string): Promise<void> {
    this.deleted.push(publicId);
  }
}

describe("internship use cases", () => {
  it("creates internships as drafts by default", async () => {
    const repo = new FakeInternshipRepository();
    const created = await new CreateInternshipUseCase(repo, new FakeStorage()).execute({
      title: "Field Engineering Intern",
      description: "Support field surveys.",
      postedBy: "admin"
    });

    expect(created.active).toBe(false);
  });

  it("stores a Google Forms application URL", async () => {
    const repo = new FakeInternshipRepository();
    const created = await new CreateInternshipUseCase(repo, new FakeStorage()).execute({
      title: "Field Engineering Intern",
      description: "Support field surveys.",
      applyUrl: "https://forms.gle/example",
      postedBy: "admin"
    });

    expect(created.applyUrl).toBe("https://forms.gle/example");
  });

  it("requires a Google Form before publishing an internship", async () => {
    await expect(
      new CreateInternshipUseCase(new FakeInternshipRepository(), new FakeStorage()).execute({
        title: "Field Engineering Intern",
        description: "Support field surveys.",
        active: true,
        postedBy: "admin"
      })
    ).rejects.toThrow("Publishing an internship requires a Google Forms application URL.");
  });

  it("updates active state", async () => {
    const repo = new FakeInternshipRepository();
    const created = await repo.create({
      title: "Intern",
      description: "Body",
      active: true,
      postedBy: "admin"
    });

    const saved = await new UpdateInternshipUseCase(repo, new FakeStorage()).execute(created.id, { active: false });
    expect(saved.active).toBe(false);
  });

  it("removes stored attachment on delete", async () => {
    const repo = new FakeInternshipRepository();
    const storage = new FakeStorage();
    const created = await repo.create({
      title: "Intern",
      description: "Body",
      attachmentUrl: "https://cdn.example.com/internship.pdf",
      attachmentPublicId: "pdf-id",
      active: true,
      postedBy: "admin"
    });

    await new DeleteInternshipUseCase(repo, storage).execute(created.id);
    expect(await repo.findById(created.id)).toBeNull();
    expect(storage.deleted).toEqual(["pdf-id"]);
  });
});
