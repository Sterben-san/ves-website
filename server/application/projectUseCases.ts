import type { Project, ProjectImage } from "@/server/domain/entities";
import type { IProjectRepository } from "@/server/domain/repositories";
import type { IStorageService } from "@/server/domain/services";
import { slugify } from "./slug";
import { validateMediaUpload, type UploadFileInput } from "./uploadValidation";

export class ListPublishedProjectsUseCase {
  constructor(private readonly projects: IProjectRepository) {}

  async execute(input: { featured?: boolean } = {}) {
    return this.projects.listPublished(input.featured);
  }
}

export class ListFeaturedProjectsUseCase {
  constructor(private readonly projects: IProjectRepository) {}

  async execute() {
    return this.projects.listPublished(true);
  }
}

export class GetPublishedProjectUseCase {
  constructor(private readonly projects: IProjectRepository) {}

  async execute(slug: string) {
    const project = await this.projects.findBySlug(slug);
    if (!project?.published || !isCompleteProject(project)) return null;
    return project;
  }
}

export class ListAllProjectsForAdminUseCase {
  constructor(private readonly projects: IProjectRepository) {}

  async execute() {
    return this.projects.list();
  }
}

export class CreateProjectUseCase {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly storage: IStorageService
  ) {}

  async execute(input: ProjectInput) {
    const slug = await uniqueSlug(input.slug || input.title || "draft-project", this.projects);
    const cover = input.file ? await uploadCover(this.storage, input.file, slug) : coverFromInput(input);
    const galleryImages = [...(input.galleryImages ?? []), ...(await uploadGallery(this.storage, input.galleryFiles, slug))];
    const project = normalizeProject({
      title: optional(input.title) ?? "",
      slug,
      summary: optional(input.summary) ?? "",
      body: optional(input.body) ?? "",
      location: optional(input.location),
      mapUrl: optional(input.mapUrl),
      category: optional(input.category),
      displayOrder: input.displayOrder ?? currentSortOrder(),
      featured: Boolean(input.featured),
      published: Boolean(input.published),
      galleryImages,
      ...cover
    });
    return this.projects.create(project);
  }
}

export class UpdateProjectUseCase {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly storage: IStorageService
  ) {}

  async execute(id: string, input: Partial<ProjectInput> & { removeCover?: boolean }) {
    const current = await this.projects.findById(id);
    if (!current) {
      throw new Error("Project not found.");
    }

    const update: Partial<Omit<Project, "id" | "createdAt" | "updatedAt">> = {};
    if (input.title !== undefined) update.title = optional(input.title) ?? "";
    if (input.slug !== undefined) update.slug = await uniqueSlug(input.slug || input.title || "draft-project", this.projects, current.id);
    if (input.summary !== undefined) update.summary = optional(input.summary) ?? "";
    if (input.body !== undefined) update.body = optional(input.body) ?? "";
    if (input.location !== undefined) update.location = optional(input.location);
    if (input.mapUrl !== undefined) update.mapUrl = optional(input.mapUrl);
    if (input.category !== undefined) update.category = optional(input.category);
    if (input.displayOrder !== undefined) update.displayOrder = input.displayOrder;
    if (input.featured !== undefined) update.featured = input.featured;
    if (input.published !== undefined) update.published = input.published;

    if (input.file) {
      const slug = update.slug ?? current.slug;
      Object.assign(update, await uploadCover(this.storage, input.file, slug));
      await deleteStored(this.storage, current.coverPublicId);
    } else if (input.removeCover) {
      update.coverUrl = undefined;
      update.coverPublicId = undefined;
      await deleteStored(this.storage, current.coverPublicId);
    }

    if (input.removeGalleryPublicIds?.length) {
      const removeSet = new Set(input.removeGalleryPublicIds);
      update.galleryImages = current.galleryImages.filter((image) => !removeSet.has(image.publicId));
      await Promise.all(input.removeGalleryPublicIds.map((publicId) => deleteStored(this.storage, publicId)));
    }

    if (input.galleryFiles?.length) {
      const slug = update.slug ?? current.slug;
      update.galleryImages = [...(update.galleryImages ?? current.galleryImages), ...(await uploadGallery(this.storage, input.galleryFiles, slug))];
    }

    const merged = normalizeProject({ ...current, ...update });
    const saved = await this.projects.update(id, merged);
    if (!saved) {
      throw new Error("Project not found.");
    }
    return saved;
  }
}

export class DeleteProjectUseCase {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly storage: IStorageService
  ) {}

  async execute(id: string) {
    const current = await this.projects.findById(id);
    if (!current) {
      throw new Error("Project not found.");
    }
    await deleteStored(this.storage, current.coverPublicId);
    await Promise.all(current.galleryImages.map((image) => deleteStored(this.storage, image.publicId)));
    await this.projects.delete(id);
  }
}

export class ReorderProjectsUseCase {
  constructor(private readonly projects: IProjectRepository) {}

  async execute(ids: string[]) {
    return this.projects.reorder(ids);
  }
}

export type ProjectInput = {
  title?: string;
  slug?: string;
  summary?: string;
  body?: string;
  location?: string;
  mapUrl?: string;
  category?: string;
  coverUrl?: string;
  coverPublicId?: string;
  galleryImages?: ProjectImage[];
  displayOrder?: number;
  featured?: boolean;
  published?: boolean;
  file?: UploadFileInput;
  galleryFiles?: UploadFileInput[];
  removeGalleryPublicIds?: string[];
};

function normalizeProject(project: Omit<Project, "id" | "createdAt" | "updatedAt">): Omit<Project, "id" | "createdAt" | "updatedAt"> {
  const complete = isCompleteProject(project);
  return {
    ...project,
    galleryImages: project.galleryImages ?? [],
    featured: complete ? project.featured : false,
    published: complete ? project.published : false
  };
}

function isCompleteProject(project: Pick<Project, "title" | "slug" | "summary" | "coverUrl">) {
  return Boolean(project.title.trim() && project.slug.trim() && project.summary.trim() && project.coverUrl);
}

async function uploadCover(storage: IStorageService, file: UploadFileInput, slug: string) {
  const mediaType = validateMediaUpload(file.mimeType, file.buffer.byteLength);
  if (mediaType !== "image") {
    throw new Error("Project cover must be a JPG, PNG, or WebP image.");
  }
  const stored = await storage.upload({ ...file, folder: `ves/projects/${slug}` });
  return {
    coverUrl: optimizeCloudinaryUrl(stored.url),
    coverPublicId: stored.publicId
  };
}

async function uploadGallery(storage: IStorageService, files: UploadFileInput[] = [], slug: string): Promise<ProjectImage[]> {
  const images: ProjectImage[] = [];
  for (const file of files) {
    const mediaType = validateMediaUpload(file.mimeType, file.buffer.byteLength);
    if (mediaType !== "image") {
      throw new Error("Project gallery files must be JPG, PNG, or WebP images.");
    }
    const stored = await storage.upload({ ...file, folder: `ves/projects/${slug}/gallery` });
    images.push({
      url: optimizeCloudinaryUrl(stored.url),
      publicId: stored.publicId,
      altText: file.fileName
    });
  }
  return images;
}

function coverFromInput(input: ProjectInput) {
  return {
    coverUrl: optional(input.coverUrl),
    coverPublicId: optional(input.coverPublicId)
  };
}

async function uniqueSlug(value: string, projects: IProjectRepository, currentId?: string) {
  const base = slugify(value) || "draft-project";
  let candidate = base;
  let suffix = 2;
  while (true) {
    const existing = await projects.findBySlug(candidate);
    if (!existing || existing.id === currentId) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function optional(value?: string) {
  const cleaned = value?.trim();
  return cleaned || undefined;
}

function optimizeCloudinaryUrl(url: string) {
  return url.includes("/upload/") ? url.replace("/upload/", "/upload/f_auto,q_auto/") : url;
}

function currentSortOrder() {
  return Math.floor(Date.now() / 1000);
}

async function deleteStored(storage: IStorageService, publicId?: string) {
  if (publicId) {
    await storage.delete(publicId).catch(() => undefined);
  }
}
