import type { MediaType } from "@/server/domain/entities";

export type UploadFileInput = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
};

const allowedMediaMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]);
const allowedAttachmentMimeTypes = new Set([...allowedMediaMimeTypes, "application/pdf"]);
const maxImageBytes = 15 * 1024 * 1024;
const maxVideoBytes = 100 * 1024 * 1024;
const maxPdfBytes = 15 * 1024 * 1024;

export function validateMediaUpload(mimeType: string, size: number): MediaType {
  if (!allowedMediaMimeTypes.has(mimeType)) {
    throw new Error("Unsupported file type. Use JPG, PNG, WebP, MP4, or WebM.");
  }

  const mediaType: MediaType = mimeType.startsWith("image/") ? "image" : "video";
  const limit = mediaType === "image" ? maxImageBytes : maxVideoBytes;
  if (size > limit) {
    throw new Error(mediaType === "image" ? "Image uploads must be 15MB or smaller." : "Video uploads must be 100MB or smaller.");
  }

  return mediaType;
}

export function validateAttachmentUpload(mimeType: string, size: number) {
  if (!allowedAttachmentMimeTypes.has(mimeType)) {
    throw new Error("Unsupported attachment type. Use JPG, PNG, WebP, MP4, WebM, or PDF.");
  }

  if (mimeType === "application/pdf" && size > maxPdfBytes) {
    throw new Error("PDF uploads must be 15MB or smaller.");
  }

  if (mimeType !== "application/pdf") {
    validateMediaUpload(mimeType, size);
  }
}
