import type { Certificate } from "@/server/domain/entities";
import type { ICertificateRepository } from "@/server/domain/repositories";
import type { IStorageService } from "@/server/domain/services";
import type { UploadFileInput } from "./uploadValidation";

export const initialCertificates: Array<Omit<Certificate, "id" | "createdAt" | "updatedAt">> = [
  {
    title: "ISO 9001 Quality Management Certificate",
    issuer: "Quality Management System Certification",
    description: "A quality-management certificate supporting VES processes, documentation, and delivery discipline.",
    certificateUrl: "/certifications/iso-9001-certificate.pdf",
    previewUrl: "/certifications/previews/iso-9001-certificate-optimized.png",
    displayOrder: 0,
    published: true
  },
  {
    title: "Company Incorporation Approval",
    issuer: "Ministry of Corporate Affairs",
    description: "Incorporation approval documentation for Vishwakarma Evolution Solutions Private Limited.",
    certificateUrl: "/certifications/incorporation-approval-letter.pdf",
    previewUrl: "/certifications/previews/incorporation-approval-letter-optimized.png",
    displayOrder: 1,
    published: true
  },
  {
    title: "Startup India Recognition",
    issuer: "Department for Promotion of Industry and Internal Trade",
    description: "Startup India recognition for Vishwakarma Evolution Solutions Private Limited.",
    certificateUrl: "/certifications/startup-india-recognition.pdf",
    previewUrl: "/certifications/previews/startup-india-recognition-optimized.png",
    displayOrder: 2,
    published: true
  }
];

export class ListPublishedCertificatesUseCase {
  constructor(private readonly certificates: ICertificateRepository) {}

  async execute() {
    return this.certificates.listPublished();
  }
}

export class ListAllCertificatesForAdminUseCase {
  constructor(private readonly certificates: ICertificateRepository) {}

  async execute() {
    return this.certificates.list();
  }
}

export class CreateCertificateUseCase {
  constructor(
    private readonly certificates: ICertificateRepository,
    private readonly storage: IStorageService
  ) {}

  async execute(input: CertificateInput & { file: UploadFileInput }) {
    const file = await uploadCertificate(this.storage, input.file, input.title);
    return this.certificates.create({
      title: required(input.title, "Title"),
      issuer: required(input.issuer, "Issuer"),
      description: optional(input.description) ?? "",
      issuedOn: optionalDate(input.issuedOn),
      displayOrder: input.displayOrder ?? Date.now(),
      published: input.published ?? true,
      certificateUrl: file.certificateUrl,
      certificatePublicId: file.certificatePublicId
    });
  }
}

export class UpdateCertificateUseCase {
  constructor(
    private readonly certificates: ICertificateRepository,
    private readonly storage: IStorageService
  ) {}

  async execute(id: string, input: Partial<CertificateInput> & { file?: UploadFileInput }) {
    const current = await this.certificates.findById(id);
    if (!current) {
      throw new Error("Certificate not found.");
    }

    const update: Partial<Omit<Certificate, "id" | "createdAt" | "updatedAt">> = {};
    if (input.title !== undefined) update.title = required(input.title, "Title");
    if (input.issuer !== undefined) update.issuer = required(input.issuer, "Issuer");
    if (input.description !== undefined) update.description = optional(input.description) ?? "";
    if (input.issuedOn !== undefined) update.issuedOn = optionalDate(input.issuedOn);
    if (input.displayOrder !== undefined) update.displayOrder = input.displayOrder;
    if (input.published !== undefined) update.published = input.published;

    if (input.file) {
      Object.assign(update, await uploadCertificate(this.storage, input.file, update.title ?? current.title));
      await deleteStored(this.storage, current.certificatePublicId);
    }

    const saved = await this.certificates.update(id, update);
    if (!saved) {
      throw new Error("Certificate not found.");
    }
    return saved;
  }
}

export class DeleteCertificateUseCase {
  constructor(
    private readonly certificates: ICertificateRepository,
    private readonly storage: IStorageService
  ) {}

  async execute(id: string) {
    const current = await this.certificates.findById(id);
    if (!current) {
      throw new Error("Certificate not found.");
    }
    await deleteStored(this.storage, current.certificatePublicId);
    await this.certificates.delete(id);
  }
}

export class ReorderCertificatesUseCase {
  constructor(private readonly certificates: ICertificateRepository) {}

  async execute(ids: string[]) {
    return this.certificates.reorder(ids);
  }
}

export async function seedInitialCertificates(certificates: ICertificateRepository) {
  for (const certificate of initialCertificates) {
    const existing = await certificates.findByUrl(certificate.certificateUrl);
    if (!existing) {
      await certificates.create(certificate);
    } else if (certificate.previewUrl && existing.previewUrl !== certificate.previewUrl) {
      await certificates.update(existing.id, { previewUrl: certificate.previewUrl });
    }
  }
}

type CertificateInput = {
  title: string;
  issuer: string;
  description?: string;
  issuedOn?: string;
  displayOrder?: number;
  published?: boolean;
};

async function uploadCertificate(storage: IStorageService, file: UploadFileInput, title: string) {
  if (file.mimeType !== "application/pdf") {
    throw new Error("Certificates must be uploaded as PDF files.");
  }
  if (file.buffer.byteLength > 15 * 1024 * 1024) {
    throw new Error("Certificate PDFs must be 15MB or smaller.");
  }

  const stored = await storage.upload({
    ...file,
    folder: `ves/certifications/${slugFolder(title)}`
  });

  return {
    certificateUrl: stored.url,
    certificatePublicId: stored.publicId
  };
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

function optionalDate(value?: string) {
  const cleaned = optional(value);
  if (!cleaned) return undefined;
  const parsed = new Date(cleaned);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Issued date must be a valid date.");
  }
  return parsed;
}

function slugFolder(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "certificate";
}

async function deleteStored(storage: IStorageService, publicId?: string) {
  if (publicId) {
    await storage.delete(publicId).catch(() => undefined);
  }
}
