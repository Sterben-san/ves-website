import { describe, expect, it } from "vitest";
import { CreateTeamMemberUseCase, DeleteTeamMemberUseCase, ReorderTeamMembersUseCase, UpdateTeamMemberUseCase } from "@/server/application/teamMemberUseCases";
import type { StoredAsset, TeamMember } from "@/server/domain/entities";
import type { ITeamMemberRepository } from "@/server/domain/repositories";
import type { IStorageService } from "@/server/domain/services";

class FakeTeamMemberRepository implements ITeamMemberRepository {
  records = new Map<string, TeamMember>();

  async list() {
    return [...this.records.values()].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async listActive() {
    return (await this.list()).filter((member) => member.active);
  }

  async findById(id: string) {
    return this.records.get(id) ?? null;
  }

  async findByEmail(email: string) {
    return [...this.records.values()].find((member) => member.email === email.toLowerCase()) ?? null;
  }

  async create(member: Omit<TeamMember, "id" | "createdAt" | "updatedAt">) {
    const now = new Date();
    const record = { ...member, id: `team-${this.records.size + 1}`, createdAt: now, updatedAt: now };
    this.records.set(record.id, record);
    return record;
  }

  async update(id: string, member: Partial<Omit<TeamMember, "id" | "createdAt" | "updatedAt">>) {
    const current = this.records.get(id);
    if (!current) return null;
    const saved = { ...current, ...member, updatedAt: new Date() };
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
    return { mediaType: "image", url: "https://res.cloudinary.com/demo/image/upload/team.jpg", publicId: "team-photo" };
  }

  async delete(publicId: string): Promise<void> {
    this.deleted.push(publicId);
  }
}

const baseInput = {
  fullName: "E. Shashidhar",
  role: "Founder",
  bio: "Founder bio",
  email: "shashidhar@ves.local",
  linkedinUrl: "https://linkedin.com/in/shashidhar",
  socials: [],
  active: true
};

describe("team member use cases", () => {
  it("creates active team members with validated social links", async () => {
    const repo = new FakeTeamMemberRepository();
    const created = await new CreateTeamMemberUseCase(repo, new FakeStorage()).execute({
      ...baseInput,
      socials: [{ platform: "github", url: "https://github.com/ves" }]
    });

    expect(created.active).toBe(true);
    expect(created.email).toBe("shashidhar@ves.local");
    expect(created.socials).toEqual([{ platform: "github", url: "https://github.com/ves" }]);
  });

  it("rejects invalid required URLs", async () => {
    await expect(
      new CreateTeamMemberUseCase(new FakeTeamMemberRepository(), new FakeStorage()).execute({
        ...baseInput,
        linkedinUrl: "not-a-url"
      })
    ).rejects.toThrow("LinkedIn URL must be a valid URL.");
  });

  it("uploads and removes team photos", async () => {
    const repo = new FakeTeamMemberRepository();
    const storage = new FakeStorage();
    const created = await new CreateTeamMemberUseCase(repo, storage).execute({
      ...baseInput,
      file: { buffer: Buffer.from([1, 2, 3]), fileName: "photo.jpg", mimeType: "image/jpeg" }
    });

    expect(created.photoPublicId).toBe("team-photo");

    const updated = await new UpdateTeamMemberUseCase(repo, storage).execute(created.id, { removePhoto: true });
    expect(updated.photoUrl).toBeUndefined();
    expect(storage.deleted).toEqual(["team-photo"]);
  });

  it("toggles visibility and reorders members", async () => {
    const repo = new FakeTeamMemberRepository();
    const first = await repo.create({ ...baseInput, displayOrder: 0 });
    const second = await repo.create({ ...baseInput, fullName: "J. Venkat Ani", email: "venkatani@ves.local", displayOrder: 1 });

    const hidden = await new UpdateTeamMemberUseCase(repo, new FakeStorage()).execute(first.id, { active: false });
    expect(hidden.active).toBe(false);

    await new ReorderTeamMembersUseCase(repo).execute([second.id, first.id]);
    expect((await repo.findById(second.id))?.displayOrder).toBe(0);
    expect((await repo.findById(first.id))?.displayOrder).toBe(1);
  });

  it("deletes stored photos with the member", async () => {
    const repo = new FakeTeamMemberRepository();
    const storage = new FakeStorage();
    const created = await repo.create({ ...baseInput, photoPublicId: "old-photo", displayOrder: 0 });

    await new DeleteTeamMemberUseCase(repo, storage).execute(created.id);
    expect(await repo.findById(created.id)).toBeNull();
    expect(storage.deleted).toEqual(["old-photo"]);
  });
});
