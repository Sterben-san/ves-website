import type { InternshipUpdate } from "@/server/domain/entities";
import type { IInternshipRepository } from "@/server/domain/repositories";
import type { IStorageService } from "@/server/domain/services";
import { validateAttachmentUpload, type UploadFileInput } from "./uploadValidation";

export class ListActiveInternshipsUseCase {
  constructor(private readonly internships: IInternshipRepository) {}

  async execute() {
    return this.internships.listActive();
  }
}

export class ListAllInternshipsForAdminUseCase {
  constructor(private readonly internships: IInternshipRepository) {}

  async execute() {
    return this.internships.listAll();
  }
}

export class CreateInternshipUseCase {
  constructor(
    private readonly internships: IInternshipRepository,
    private readonly storage: IStorageService
  ) {}

  async execute(input: {
    title: string;
    description: string;
    location?: string;
    applyUrl?: string;
    applyEmail?: string;
    active?: boolean;
    postedBy: string;
    file?: UploadFileInput;
  }) {
    const attachment = input.file ? await uploadAttachment(this.storage, input.file, input.title) : {};
    const applyUrl = googleFormUrl(input.applyUrl);
    const active = input.active ?? false;
    if (active && !applyUrl) {
      throw new Error("Publishing an internship requires a Google Forms application URL.");
    }
    return this.internships.create({
      title: required(input.title, "Title"),
      description: required(input.description, "Description"),
      location: optional(input.location),
      applyUrl,
      applyEmail: optional(input.applyEmail),
      active,
      postedBy: input.postedBy,
      ...attachment
    });
  }
}

export class UpdateInternshipUseCase {
  constructor(
    private readonly internships: IInternshipRepository,
    private readonly storage: IStorageService
  ) {}

  async execute(
    id: string,
    input: { title?: string; description?: string; location?: string; applyUrl?: string; applyEmail?: string; active?: boolean; file?: UploadFileInput; removeAttachment?: boolean }
  ) {
    const current = await this.internships.findById(id);
    if (!current) {
      throw new Error("Internship update not found.");
    }

    const update: Partial<Omit<InternshipUpdate, "id" | "createdAt" | "updatedAt">> = {};
    if (input.title !== undefined) {
      update.title = required(input.title, "Title");
    }
    if (input.description !== undefined) {
      update.description = required(input.description, "Description");
    }
    if (input.location !== undefined) {
      update.location = optional(input.location);
    }
    if (input.applyUrl !== undefined) {
      update.applyUrl = googleFormUrl(input.applyUrl);
    }
    if (input.applyEmail !== undefined) {
      update.applyEmail = optional(input.applyEmail);
    }
    if (input.active !== undefined) {
      update.active = input.active;
    }

    const publishWithForm = update.active ?? current.active;
    const applicationUrl = update.applyUrl ?? current.applyUrl;
    if (publishWithForm && !applicationUrl) {
      throw new Error("Publishing an internship requires a Google Forms application URL.");
    }

    if (input.file) {
      Object.assign(update, await uploadAttachment(this.storage, input.file, update.title ?? current.title));
      await deleteStored(this.storage, current.attachmentPublicId);
    } else if (input.removeAttachment) {
      update.attachmentUrl = undefined;
      update.attachmentPublicId = undefined;
      await deleteStored(this.storage, current.attachmentPublicId);
    }

    const saved = await this.internships.update(id, update);
    if (!saved) {
      throw new Error("Internship update not found.");
    }
    return saved;
  }
}

export class DeactivateInternshipUseCase {
  constructor(private readonly internships: IInternshipRepository) {}

  async execute(id: string) {
    const saved = await this.internships.update(id, { active: false });
    if (!saved) {
      throw new Error("Internship update not found.");
    }
    return saved;
  }
}

export class DeleteInternshipUseCase {
  constructor(
    private readonly internships: IInternshipRepository,
    private readonly storage: IStorageService
  ) {}

  async execute(id: string) {
    const current = await this.internships.findById(id);
    if (!current) {
      throw new Error("Internship update not found.");
    }
    await deleteStored(this.storage, current.attachmentPublicId);
    await this.internships.delete(id);
  }
}

async function uploadAttachment(storage: IStorageService, file: UploadFileInput, title: string) {
  validateAttachmentUpload(file.mimeType, file.buffer.byteLength);
  const stored = await storage.upload({
    ...file,
    folder: `ves/internships/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "attachment"}`
  });

  return {
    attachmentUrl: stored.url,
    attachmentPublicId: stored.publicId
  };
}

function required(value: string, label: string) {
  const cleaned = value.trim();
  if (!cleaned) {
    throw new Error(`${label} is required.`);
  }
  return cleaned;
}

function optional(value?: string) {
  const cleaned = value?.trim();
  return cleaned || undefined;
}

function googleFormUrl(value?: string) {
  const cleaned = optional(value);
  if (!cleaned) return undefined;

  let url: URL;
  try {
    url = new URL(cleaned);
  } catch {
    throw new Error("Application form must be a valid Google Forms URL.");
  }

  const validHost =
    url.hostname === "forms.gle" ||
    url.hostname === "forms.google.com" ||
    (url.hostname === "docs.google.com" && url.pathname.startsWith("/forms/"));
  if (url.protocol !== "https:" || !validHost) {
    throw new Error("Application form must be a Google Forms URL.");
  }
  return url.toString();
}

async function deleteStored(storage: IStorageService, publicId?: string) {
  if (publicId) {
    await storage.delete(publicId).catch(() => undefined);
  }
}
