import type { HomepageNewsItem } from "@/server/domain/entities";
import type { IHomepageNewsRepository } from "@/server/domain/repositories";
import type { IStorageService } from "@/server/domain/services";
import { validateMediaUpload, type UploadFileInput } from "./uploadValidation";

export class ListPublishedHomepageNewsUseCase {
  constructor(private readonly news: IHomepageNewsRepository) {}

  async execute() {
    return this.news.listPublished();
  }
}

export class ListAllHomepageNewsForAdminUseCase {
  constructor(private readonly news: IHomepageNewsRepository) {}

  async execute() {
    return this.news.list();
  }
}

export class CreateHomepageNewsUseCase {
  constructor(
    private readonly news: IHomepageNewsRepository,
    private readonly storage: IStorageService
  ) {}

  async execute(input: HomepageNewsInput) {
    const image = input.file ? await uploadImage(this.storage, input.file, input.title) : imageFromInput(input);
    const normalized = normalizeHomepageNewsItem({
      kind: input.kind,
      title: optional(input.title) ?? "",
      summary: optional(input.summary) ?? "",
      body: optional(input.body),
      linkLabel: optional(input.linkLabel),
      linkHref: optional(input.linkHref),
      displayOrder: input.displayOrder ?? Date.now(),
      published: Boolean(input.published),
      ...image
    });
    return this.news.create(normalized);
  }
}

export class UpdateHomepageNewsUseCase {
  constructor(
    private readonly news: IHomepageNewsRepository,
    private readonly storage: IStorageService
  ) {}

  async execute(id: string, input: Partial<HomepageNewsInput> & { removeImage?: boolean }) {
    const current = await this.news.findById(id);
    if (!current) {
      throw new Error("Homepage news item not found.");
    }

    const update: Partial<Omit<HomepageNewsItem, "id" | "createdAt" | "updatedAt">> = {};
    if (input.kind !== undefined) update.kind = input.kind;
    if (input.title !== undefined) update.title = optional(input.title) ?? "";
    if (input.summary !== undefined) update.summary = optional(input.summary) ?? "";
    if (input.body !== undefined) update.body = optional(input.body);
    if (input.linkLabel !== undefined) update.linkLabel = optional(input.linkLabel);
    if (input.linkHref !== undefined) update.linkHref = optional(input.linkHref);
    if (input.displayOrder !== undefined) update.displayOrder = input.displayOrder;
    if (input.published !== undefined) update.published = input.published;

    if (input.file) {
      Object.assign(update, await uploadImage(this.storage, input.file, update.title ?? current.title));
      await deleteStored(this.storage, current.imagePublicId);
    } else if (input.removeImage) {
      update.imageUrl = undefined;
      update.imagePublicId = undefined;
      await deleteStored(this.storage, current.imagePublicId);
    }

    const saved = await this.news.update(id, normalizeHomepageNewsItem({ ...current, ...update }));
    if (!saved) {
      throw new Error("Homepage news item not found.");
    }
    return saved;
  }
}

export class DeleteHomepageNewsUseCase {
  constructor(
    private readonly news: IHomepageNewsRepository,
    private readonly storage: IStorageService
  ) {}

  async execute(id: string) {
    const current = await this.news.findById(id);
    if (!current) {
      throw new Error("Homepage news item not found.");
    }
    await deleteStored(this.storage, current.imagePublicId);
    await this.news.delete(id);
  }
}

export class ReorderHomepageNewsUseCase {
  constructor(private readonly news: IHomepageNewsRepository) {}

  async execute(ids: string[]) {
    return this.news.reorder(ids);
  }
}

export type HomepageNewsInput = {
  kind: HomepageNewsItem["kind"];
  title?: string;
  summary?: string;
  body?: string;
  imageUrl?: string;
  imagePublicId?: string;
  linkLabel?: string;
  linkHref?: string;
  displayOrder?: number;
  published?: boolean;
  file?: UploadFileInput;
};

function normalizeHomepageNewsItem(item: Omit<HomepageNewsItem, "id" | "createdAt" | "updatedAt">): Omit<HomepageNewsItem, "id" | "createdAt" | "updatedAt"> {
  const complete = Boolean(item.title.trim() && item.summary.trim());
  return {
    ...item,
    published: complete ? item.published : false
  };
}

async function uploadImage(storage: IStorageService, file: UploadFileInput, title?: string) {
  const mediaType = validateMediaUpload(file.mimeType, file.buffer.byteLength);
  if (mediaType !== "image") {
    throw new Error("Homepage news media must be a JPG, PNG, or WebP image.");
  }
  const folderName = optional(title)?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item";
  const stored = await storage.upload({ ...file, folder: `ves/homepage-news/${folderName}` });
  return {
    imageUrl: optimizeCloudinaryUrl(stored.url),
    imagePublicId: stored.publicId
  };
}

function imageFromInput(input: HomepageNewsInput) {
  return {
    imageUrl: optional(input.imageUrl),
    imagePublicId: optional(input.imagePublicId)
  };
}

function optional(value?: string) {
  const cleaned = value?.trim();
  return cleaned || undefined;
}

function optimizeCloudinaryUrl(url: string) {
  return url.includes("/upload/") ? url.replace("/upload/", "/upload/f_auto,q_auto/") : url;
}

async function deleteStored(storage: IStorageService, publicId?: string) {
  if (publicId) {
    await storage.delete(publicId).catch(() => undefined);
  }
}
