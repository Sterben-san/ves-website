import type { Announcement, AnnouncementKind, MediaType } from "@/server/domain/entities";
import type { IAnnouncementRepository } from "@/server/domain/repositories";
import type { IStorageService } from "@/server/domain/services";
import { validateMediaUpload, type UploadFileInput } from "./uploadValidation";
import { slugify } from "./slug";

export class ListPublishedAnnouncementsUseCase {
  constructor(private readonly announcements: IAnnouncementRepository) {}

  async execute(input: { kind?: AnnouncementKind; page?: number; pageSize?: number } = {}) {
    const all = await this.announcements.listPublished(input.kind);
    return paginate(all, input.page ?? 1, input.pageSize ?? 12);
  }
}

export class ListAllAnnouncementsForAdminUseCase {
  constructor(private readonly announcements: IAnnouncementRepository) {}

  async execute(kind?: AnnouncementKind) {
    return this.announcements.list(kind);
  }
}

export class GetPublishedAnnouncementUseCase {
  constructor(private readonly announcements: IAnnouncementRepository) {}

  async execute(slug: string) {
    const announcement = await this.announcements.findBySlug(slug);
    if (!announcement || !announcement.published) {
      throw new Error("Announcement not found.");
    }
    return announcement;
  }
}

export class GetPinnedAnnouncementUseCase {
  constructor(private readonly announcements: IAnnouncementRepository) {}

  async execute() {
    return this.announcements.findPinned();
  }
}

export class CreateAnnouncementUseCase {
  constructor(
    private readonly announcements: IAnnouncementRepository,
    private readonly storage: IStorageService
  ) {}

  async execute(input: AnnouncementInput & { authorId: string }) {
    const slug = await uniqueSlug(input.title, this.announcements);
    const assets = await uploadAnnouncementAssets(this.storage, input, slug);
    const announcement = await this.announcements.create({
      kind: input.kind,
      title: cleanRequired(input.title, "Title"),
      slug,
      body: cleanRequired(input.body, "Body"),
      ctaLabel: optional(input.ctaLabel),
      ctaHref: optional(input.ctaHref),
      backgroundType: input.backgroundType ?? "none",
      overlayOpacity: clampOpacity(input.overlayOpacity),
      textPosition: input.textPosition ?? "left",
      pinned: Boolean(input.pinned),
      published: Boolean(input.published),
      authorId: input.authorId,
      ...assets
    });
    return announcement;
  }
}

export class UpdateAnnouncementUseCase {
  constructor(
    private readonly announcements: IAnnouncementRepository,
    private readonly storage: IStorageService
  ) {}

  async execute(id: string, input: Partial<AnnouncementInput>) {
    const current = await this.announcements.findById(id);
    if (!current) {
      throw new Error("Announcement not found.");
    }

    const update: Partial<Omit<Announcement, "id" | "createdAt" | "updatedAt">> = {};
    if (input.kind) update.kind = input.kind;
    if (input.title !== undefined) {
      update.title = cleanRequired(input.title, "Title");
      if (update.title !== current.title) {
        update.slug = await uniqueSlug(update.title, this.announcements, current.id);
      }
    }
    if (input.body !== undefined) update.body = cleanRequired(input.body, "Body");
    if (input.ctaLabel !== undefined) update.ctaLabel = optional(input.ctaLabel);
    if (input.ctaHref !== undefined) update.ctaHref = optional(input.ctaHref);
    if (input.backgroundType !== undefined) update.backgroundType = input.backgroundType;
    if (input.overlayOpacity !== undefined) update.overlayOpacity = clampOpacity(input.overlayOpacity);
    if (input.textPosition !== undefined) update.textPosition = input.textPosition;
    if (input.published !== undefined) update.published = input.published;
    if (input.pinned !== undefined) update.pinned = input.pinned;

    const slug = update.slug ?? current.slug;
    const assets = await uploadAnnouncementAssets(this.storage, input, slug);
    Object.assign(update, assets);

    if (assets.backgroundPublicId && current.backgroundPublicId) await deleteStored(this.storage, current.backgroundPublicId);
    if (assets.posterPublicId && current.posterPublicId) await deleteStored(this.storage, current.posterPublicId);
    if (assets.mobileFallbackPublicId && current.mobileFallbackPublicId) await deleteStored(this.storage, current.mobileFallbackPublicId);

    const saved = await this.announcements.update(id, update);
    if (!saved) {
      throw new Error("Announcement not found.");
    }
    return saved;
  }
}

export class PinAnnouncementUseCase {
  constructor(private readonly announcements: IAnnouncementRepository) {}

  async execute(id: string) {
    const saved = await this.announcements.setPinned(id);
    if (!saved) {
      throw new Error("Announcement not found.");
    }
    return saved;
  }
}

export class DeleteAnnouncementUseCase {
  constructor(
    private readonly announcements: IAnnouncementRepository,
    private readonly storage: IStorageService
  ) {}

  async execute(id: string) {
    const current = await this.announcements.findById(id);
    if (!current) {
      throw new Error("Announcement not found.");
    }
    await deleteStored(this.storage, current.backgroundPublicId);
    await deleteStored(this.storage, current.posterPublicId);
    await deleteStored(this.storage, current.mobileFallbackPublicId);
    await this.announcements.delete(id);
  }
}

type AnnouncementInput = {
  kind: AnnouncementKind;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  backgroundType?: "none" | "image" | "video";
  overlayOpacity?: number;
  textPosition?: "left" | "center" | "right";
  pinned?: boolean;
  published?: boolean;
  backgroundFile?: UploadFileInput;
  posterFile?: UploadFileInput;
  mobileFallbackFile?: UploadFileInput;
};

async function uploadAnnouncementAssets(storage: IStorageService, input: Partial<AnnouncementInput>, slug: string) {
  const update: Partial<Announcement> = {};
  if (input.backgroundFile) {
    const mediaType = validateMediaUpload(input.backgroundFile.mimeType, input.backgroundFile.buffer.byteLength);
    if (input.backgroundType === "video" && mediaType !== "video") {
      throw new Error("Video announcements require an MP4 or WebM background.");
    }
    if (input.backgroundType === "image" && mediaType !== "image") {
      throw new Error("Image announcements require an image background.");
    }
    const stored = await storage.upload({ ...input.backgroundFile, folder: `ves/announcements/${slug}/background` });
    update.backgroundType = mediaType;
    update.backgroundUrl = optimizeCloudinaryUrl(stored.url, mediaType);
    update.backgroundPublicId = stored.publicId;
    if (mediaType === "video" && !input.posterFile) {
      update.posterUrl = posterFromVideoUrl(stored.url);
      update.posterPublicId = `${stored.publicId}:poster`;
    }
  }

  if (input.posterFile) {
    const mediaType: MediaType = validateMediaUpload(input.posterFile.mimeType, input.posterFile.buffer.byteLength);
    if (mediaType !== "image") {
      throw new Error("Poster must be an image.");
    }
    const stored = await storage.upload({ ...input.posterFile, folder: `ves/announcements/${slug}/poster` });
    update.posterUrl = optimizeCloudinaryUrl(stored.url, "image");
    update.posterPublicId = stored.publicId;
  }

  if (input.mobileFallbackFile) {
    const mediaType: MediaType = validateMediaUpload(input.mobileFallbackFile.mimeType, input.mobileFallbackFile.buffer.byteLength);
    if (mediaType !== "image") {
      throw new Error("Mobile fallback must be an image.");
    }
    const stored = await storage.upload({ ...input.mobileFallbackFile, folder: `ves/announcements/${slug}/mobile` });
    update.mobileFallbackUrl = optimizeCloudinaryUrl(stored.url, "image");
    update.mobileFallbackPublicId = stored.publicId;
  }

  if ((input.backgroundType === "video" || update.backgroundType === "video") && !update.posterUrl && !input.posterFile && !input.backgroundFile) {
    throw new Error("Video announcements require a poster image or a new video so one can be generated.");
  }

  return update;
}

async function uniqueSlug(title: string, announcements: IAnnouncementRepository, currentId?: string) {
  const base = slugify(title);
  let candidate = base;
  let suffix = 2;
  while (true) {
    const existing = await announcements.findBySlug(candidate);
    if (!existing || existing.id === currentId) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), 24);
  const start = (safePage - 1) * safePageSize;
  return {
    items: items.slice(start, start + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / safePageSize))
  };
}

function cleanRequired(value: string, label: string) {
  const cleaned = value.trim();
  if (!cleaned) throw new Error(`${label} is required.`);
  return cleaned;
}

function optional(value?: string) {
  const cleaned = value?.trim();
  return cleaned || undefined;
}

function clampOpacity(value = 0.5) {
  return Math.min(1, Math.max(0, value));
}

function optimizeCloudinaryUrl(url: string, mediaType: MediaType) {
  if (!url.includes("/upload/")) return url;
  return mediaType === "video" ? url.replace("/upload/", "/upload/f_auto,q_auto/") : url.replace("/upload/", "/upload/f_auto,q_auto/");
}

function posterFromVideoUrl(url: string) {
  if (!url.includes("/video/upload/")) return url;
  return url.replace("/video/upload/", "/video/upload/so_0,f_jpg,q_auto/").replace(/\.(mp4|webm|mov)$/i, ".jpg");
}

async function deleteStored(storage: IStorageService, publicId?: string) {
  if (publicId && !publicId.endsWith(":poster")) {
    await storage.delete(publicId).catch(() => undefined);
  }
}
