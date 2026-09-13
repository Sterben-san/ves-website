import { type UploadApiResponse, v2 as cloudinary } from "cloudinary";
import type { IStorageService } from "@/server/domain/services";
import type { StoredAssetKind } from "@/server/domain/entities";
import { requireEnv } from "@/server/config/env";

export class CloudinaryStorageService implements IStorageService {
  private configure() {
    cloudinary.config({
      cloud_name: requireEnv("cloudinaryCloudName"),
      api_key: requireEnv("cloudinaryApiKey"),
      api_secret: requireEnv("cloudinaryApiSecret")
    });
  }

  async upload(input: { buffer: Buffer; fileName: string; mimeType: string; folder: string }) {
    this.configure();
    const mediaType = resolveResourceType(input.mimeType);
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: input.folder,
          resource_type: mediaType,
          use_filename: true,
          filename_override: input.fileName
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error("Cloudinary upload failed."));
            return;
          }
          resolve(uploadResult);
        }
      );
      stream.end(input.buffer);
    });

    return {
      mediaType,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      bytes: result.bytes
    };
  }

  async delete(publicId: string): Promise<void> {
    if (!publicId) {
      return;
    }
    this.configure();
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
  }
}

function resolveResourceType(mimeType: string): StoredAssetKind {
  if (mimeType.startsWith("image/")) {
    return "image";
  }
  if (mimeType.startsWith("video/")) {
    return "video";
  }
  return "raw";
}
