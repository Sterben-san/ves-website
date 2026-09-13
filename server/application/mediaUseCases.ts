import { sectionSlotMap, sectionSlots } from "@/server/domain/sectionSlots";
import type { MediaType, SectionMedia } from "@/server/domain/entities";
import type { IMediaRepository } from "@/server/domain/repositories";
import type { IStorageService } from "@/server/domain/services";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]);
const maxImageBytes = 15 * 1024 * 1024;
const maxVideoBytes = 100 * 1024 * 1024;

export class ListMediaUseCase {
  constructor(private readonly media: IMediaRepository) {}

  async execute() {
    const records = await this.media.list();
    const byKey = new Map(records.map((record) => [record.sectionKey, record]));

    return sectionSlots.map((slot) => {
      const record = byKey.get(slot.sectionKey);
      return record ?? fallbackMedia(slot.sectionKey);
    });
  }
}

export class GetMediaUseCase {
  constructor(private readonly media: IMediaRepository) {}

  async execute(sectionKey: string) {
    assertKnownSection(sectionKey);
    return (await this.media.findBySectionKey(sectionKey)) ?? fallbackMedia(sectionKey);
  }
}

export class UploadSectionMediaUseCase {
  constructor(
    private readonly media: IMediaRepository,
    private readonly storage: IStorageService
  ) {}

  async execute(input: {
    sectionKey: string;
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    altText: string;
    uploadedBy: string;
  }) {
    const slot = assertKnownSection(input.sectionKey);
    const mediaType = validateUpload(input.mimeType, input.buffer.byteLength);
    if (mediaType === "video" && !slot.allowVideo) {
      throw new Error(`${slot.label} accepts images only.`);
    }

    const current = await this.media.findBySectionKey(input.sectionKey);
    const stored = await this.storage.upload({
      buffer: input.buffer,
      fileName: input.fileName,
      mimeType: input.mimeType,
      folder: `ves/${input.sectionKey.replaceAll(".", "-")}`
    });

    const saved = await this.media.upsert({
      sectionKey: input.sectionKey,
      mediaType: stored.mediaType as MediaType,
      url: stored.url,
      publicId: stored.publicId,
      altText: input.altText.trim() || slot.defaultAltText,
      uploadedBy: input.uploadedBy,
      width: stored.width,
      height: stored.height,
      bytes: stored.bytes ?? input.buffer.byteLength
    });

    if (current?.publicId && current.publicId !== saved.publicId) {
      await this.storage.delete(current.publicId).catch(() => undefined);
    }

    return saved;
  }
}

export class UpdateSectionAltTextUseCase {
  constructor(private readonly media: IMediaRepository) {}

  async execute(sectionKey: string, altText: string, uploadedBy?: string) {
    const slot = assertKnownSection(sectionKey);
    const cleaned = altText.trim();
    if (!cleaned) {
      throw new Error("Alt text is required.");
    }

    const current = await this.media.findBySectionKey(sectionKey);
    return this.media.upsert({
      sectionKey,
      mediaType: current?.mediaType ?? slot.defaultMediaType,
      url: current?.url ?? slot.defaultUrl,
      publicId: current?.publicId ?? "",
      altText: cleaned,
      uploadedBy: uploadedBy ?? current?.uploadedBy,
      width: current?.width,
      height: current?.height,
      bytes: current?.bytes
    });
  }
}

export class DeleteSectionMediaUseCase {
  constructor(
    private readonly media: IMediaRepository,
    private readonly storage: IStorageService
  ) {}

  async execute(sectionKey: string) {
    assertKnownSection(sectionKey);
    const current = await this.media.findBySectionKey(sectionKey);
    if (current?.publicId) {
      await this.storage.delete(current.publicId).catch(() => undefined);
    }
    await this.media.delete(sectionKey);
    return fallbackMedia(sectionKey);
  }
}

export function fallbackMedia(sectionKey: string): SectionMedia {
  const slot = assertKnownSection(sectionKey);
  return {
    id: sectionKey,
    sectionKey,
    mediaType: slot.defaultMediaType,
    url: slot.defaultUrl,
    publicId: "",
    altText: slot.defaultAltText,
    width: undefined,
    height: undefined,
    bytes: undefined,
    updatedAt: new Date(0)
  };
}

export function assertKnownSection(sectionKey: string) {
  const slot = sectionSlotMap.get(sectionKey);
  if (!slot) {
    throw new Error(`Unknown section key: ${sectionKey}`);
  }
  return slot;
}

function validateUpload(mimeType: string, size: number): MediaType {
  if (!allowedMimeTypes.has(mimeType)) {
    throw new Error("Unsupported file type. Use JPG, PNG, WebP, MP4, or WebM.");
  }

  const mediaType: MediaType = mimeType.startsWith("image/") ? "image" : "video";
  const limit = mediaType === "image" ? maxImageBytes : maxVideoBytes;
  if (size > limit) {
    throw new Error(mediaType === "image" ? "Image uploads must be 15MB or smaller." : "Video uploads must be 100MB or smaller.");
  }

  return mediaType;
}
