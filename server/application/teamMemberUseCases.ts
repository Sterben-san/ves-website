import type { TeamMember, TeamSocialLink, TeamSocialPlatform } from "@/server/domain/entities";
import type { ITeamMemberRepository } from "@/server/domain/repositories";
import type { IStorageService } from "@/server/domain/services";
import { validateMediaUpload, type UploadFileInput } from "./uploadValidation";

export class ListActiveTeamMembersUseCase {
  constructor(private readonly members: ITeamMemberRepository) {}

  async execute() {
    return this.members.listActive();
  }
}

export class ListAllTeamMembersForAdminUseCase {
  constructor(private readonly members: ITeamMemberRepository) {}

  async execute() {
    return this.members.list();
  }
}

export class CreateTeamMemberUseCase {
  constructor(
    private readonly members: ITeamMemberRepository,
    private readonly storage: IStorageService
  ) {}

  async execute(input: TeamMemberInput) {
    const email = requiredEmail(input.email);
    const existing = await this.members.findByEmail(email);
    if (existing) {
      throw new Error("A team member with this email already exists.");
    }

    const photo = input.file ? await uploadPhoto(this.storage, input.file, input.fullName) : {};
    return this.members.create({
      fullName: required(input.fullName, "Full name"),
      role: required(input.role, "Role"),
      bio: optional(input.bio) ?? "",
      email,
      phone: optional(input.phone),
      linkedinUrl: requiredUrl(input.linkedinUrl, "LinkedIn URL"),
      socials: parseSocials(input.socials),
      displayOrder: input.displayOrder ?? Date.now(),
      active: input.active ?? true,
      ...photo
    });
  }
}

export class UpdateTeamMemberUseCase {
  constructor(
    private readonly members: ITeamMemberRepository,
    private readonly storage: IStorageService
  ) {}

  async execute(id: string, input: Partial<TeamMemberInput> & { removePhoto?: boolean }) {
    const current = await this.members.findById(id);
    if (!current) {
      throw new Error("Team member not found.");
    }

    const update: Partial<Omit<TeamMember, "id" | "createdAt" | "updatedAt">> = {};
    if (input.fullName !== undefined) update.fullName = required(input.fullName, "Full name");
    if (input.role !== undefined) update.role = required(input.role, "Role");
    if (input.bio !== undefined) update.bio = optional(input.bio) ?? "";
    if (input.email !== undefined) {
      const email = requiredEmail(input.email);
      const existing = await this.members.findByEmail(email);
      if (existing && existing.id !== id) {
        throw new Error("A team member with this email already exists.");
      }
      update.email = email;
    }
    if (input.phone !== undefined) update.phone = optional(input.phone);
    if (input.linkedinUrl !== undefined) update.linkedinUrl = requiredUrl(input.linkedinUrl, "LinkedIn URL");
    if (input.socials !== undefined) update.socials = parseSocials(input.socials);
    if (input.displayOrder !== undefined) update.displayOrder = input.displayOrder;
    if (input.active !== undefined) update.active = input.active;

    if (input.file) {
      Object.assign(update, await uploadPhoto(this.storage, input.file, update.fullName ?? current.fullName));
      await deleteStored(this.storage, current.photoPublicId);
    } else if (input.removePhoto) {
      update.photoUrl = undefined;
      update.photoPublicId = undefined;
      await deleteStored(this.storage, current.photoPublicId);
    }

    const saved = await this.members.update(id, update);
    if (!saved) {
      throw new Error("Team member not found.");
    }
    return saved;
  }
}

export class DeleteTeamMemberUseCase {
  constructor(
    private readonly members: ITeamMemberRepository,
    private readonly storage: IStorageService
  ) {}

  async execute(id: string) {
    const current = await this.members.findById(id);
    if (!current) {
      throw new Error("Team member not found.");
    }
    await deleteStored(this.storage, current.photoPublicId);
    await this.members.delete(id);
  }
}

export class ReorderTeamMembersUseCase {
  constructor(private readonly members: ITeamMemberRepository) {}

  async execute(ids: string[]) {
    return this.members.reorder(ids);
  }
}

export type TeamMemberInput = {
  fullName: string;
  role: string;
  bio?: string;
  email: string;
  phone?: string;
  linkedinUrl: string;
  socials?: TeamSocialLink[] | string;
  displayOrder?: number;
  active?: boolean;
  file?: UploadFileInput;
};

async function uploadPhoto(storage: IStorageService, file: UploadFileInput, fullName: string) {
  const mediaType = validateMediaUpload(file.mimeType, file.buffer.byteLength);
  if (mediaType !== "image") {
    throw new Error("Team photos must be JPG, PNG, or WebP images.");
  }
  const stored = await storage.upload({
    ...file,
    folder: `ves/team/${slugFolder(fullName)}`
  });

  return {
    photoUrl: optimizeCloudinaryUrl(stored.url),
    photoPublicId: stored.publicId
  };
}

function parseSocials(value?: TeamSocialLink[] | string): TeamSocialLink[] {
  if (!value) return [];
  const raw = typeof value === "string" ? parseSocialJson(value) : value;
  return raw
    .map((item) => ({
      platform: parsePlatform(item.platform),
      url: requiredUrl(item.url, `${item.platform || "Social"} URL`)
    }))
    .filter((item) => item.url);
}

function parseSocialJson(value: string): TeamSocialLink[] {
  const cleaned = value.trim();
  if (!cleaned) return [];
  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch {
    throw new Error("Social links must be a valid list.");
  }
}

function parsePlatform(value: string): TeamSocialPlatform {
  const normalized = value.toLowerCase().trim();
  if (["instagram", "linkedin", "x", "github", "website", "other"].includes(normalized)) {
    return normalized as TeamSocialPlatform;
  }
  return "other";
}

function required(value: string | undefined, label: string) {
  const cleaned = value?.trim();
  if (!cleaned) {
    throw new Error(`${label} is required.`);
  }
  return cleaned;
}

function optional(value?: string) {
  const cleaned = value?.trim();
  return cleaned || undefined;
}

function requiredEmail(value?: string) {
  const cleaned = required(value, "Email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
    throw new Error("Enter a valid email address.");
  }
  return cleaned;
}

function requiredUrl(value: string | undefined, label: string) {
  const cleaned = required(value, label);
  let url: URL;
  try {
    url = new URL(cleaned);
  } catch {
    throw new Error(`${label} must be a valid URL.`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`${label} must be a valid URL.`);
  }
  return url.toString();
}

function slugFolder(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "member";
}

function optimizeCloudinaryUrl(url: string) {
  return url.includes("/upload/") ? url.replace("/upload/", "/upload/f_auto,q_auto/") : url;
}

async function deleteStored(storage: IStorageService, publicId?: string) {
  if (publicId) {
    await storage.delete(publicId).catch(() => undefined);
  }
}
