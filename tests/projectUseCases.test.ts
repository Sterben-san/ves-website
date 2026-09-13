import { describe, expect, it } from "vitest";
import { CreateProjectUseCase, DeleteProjectUseCase, ListPublishedProjectsUseCase, ReorderProjectsUseCase, UpdateProjectUseCase } from "@/server/application/projectUseCases";
import type { Project, StoredAsset } from "@/server/domain/entities";
import type { IProjectRepository } from "@/server/domain/repositories";
import type { IStorageService } from "@/server/domain/services";

class FakeProjectRepository implements IProjectRepository {
  records = new Map<string, Project>();

  async list() {
    return [...this.records.values()].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async listPublished(featured?: boolean) {
    return (await this.list()).filter((project) => project.published && (featured === undefined || project.featured === featured) && project.title && project.summary && project.coverUrl);
  }

  async findById(id: string) {
    return this.records.get(id) ?? null;
  }

  async findBySlug(slug: string) {
    return [...this.records.values()].find((project) => project.slug === slug) ?? null;
  }

  async create(project: Omit<Project, "id" | "createdAt" | "updatedAt">) {
    const now = new Date();
    const record = { ...project, id: `project-${this.records.size + 1}`, createdAt: now, updatedAt: now };
    this.records.set(record.id, record);
    return record;
  }

  async update(id: string, project: Partial<Omit<Project, "id" | "createdAt" | "updatedAt">>) {
    const current = this.records.get(id);
    if (!current) return null;
    const saved = { ...current, ...project, updatedAt: new Date() };
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
    return { mediaType: "image", url: "https://res.cloudinary.com/demo/image/upload/project.jpg", publicId: "project-cover" };
  }

  async delete(publicId: string) {
    this.deleted.push(publicId);
  }
}

const completeProject = {
  title: "High Mast Lighting",
  summary: "Large-area illumination project.",
  body: "Full details.",
  coverUrl: "https://example.com/cover.jpg",
  featured: true,
  published: true
};

describe("project use cases", () => {
  it("creates complete published projects", async () => {
    const repo = new FakeProjectRepository();
    const project = await new CreateProjectUseCase(repo, new FakeStorage()).execute(completeProject);

    expect(project.slug).toBe("high-mast-lighting");
    expect(project.published).toBe(true);
    expect(project.featured).toBe(true);
  });

  it("keeps incomplete projects hidden even when published is requested", async () => {
    const repo = new FakeProjectRepository();
    const project = await new CreateProjectUseCase(repo, new FakeStorage()).execute({
      title: "Draft",
      published: true,
      featured: true
    });

    expect(project.published).toBe(false);
    expect(project.featured).toBe(false);
    expect(await new ListPublishedProjectsUseCase(repo).execute()).toEqual([]);
  });

  it("auto-unpublishes when a required field is cleared", async () => {
    const repo = new FakeProjectRepository();
    const created = await new CreateProjectUseCase(repo, new FakeStorage()).execute(completeProject);
    const updated = await new UpdateProjectUseCase(repo, new FakeStorage()).execute(created.id, { summary: "" });

    expect(updated.published).toBe(false);
    expect(updated.featured).toBe(false);
  });

  it("uploads and deletes project covers", async () => {
    const repo = new FakeProjectRepository();
    const storage = new FakeStorage();
    const created = await new CreateProjectUseCase(repo, storage).execute({
      title: "Uploaded Cover",
      summary: "Summary",
      published: true,
      file: { buffer: Buffer.from([1, 2, 3]), fileName: "cover.jpg", mimeType: "image/jpeg" }
    });

    expect(created.coverPublicId).toBe("project-cover");

    await new DeleteProjectUseCase(repo, storage).execute(created.id);
    expect(await repo.findById(created.id)).toBeNull();
    expect(storage.deleted).toEqual(["project-cover"]);
  });

  it("reorders projects", async () => {
    const repo = new FakeProjectRepository();
    const first = await repo.create({ ...completeProject, slug: "first", displayOrder: 0 });
    const second = await repo.create({ ...completeProject, title: "Second", slug: "second", displayOrder: 1 });

    await new ReorderProjectsUseCase(repo).execute([second.id, first.id]);

    expect((await repo.findById(second.id))?.displayOrder).toBe(0);
    expect((await repo.findById(first.id))?.displayOrder).toBe(1);
  });
});
