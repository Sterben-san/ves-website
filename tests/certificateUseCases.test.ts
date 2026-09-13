import { describe, expect, it } from "vitest";
import { CreateCertificateUseCase, DeleteCertificateUseCase, ListPublishedCertificatesUseCase, UpdateCertificateUseCase } from "@/server/application/certificateUseCases";
import type { Certificate, StoredAsset } from "@/server/domain/entities";
import type { ICertificateRepository } from "@/server/domain/repositories";
import type { IStorageService } from "@/server/domain/services";

class FakeCertificateRepository implements ICertificateRepository {
  records = new Map<string, Certificate>();

  async list() {
    return [...this.records.values()].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async listPublished() {
    return (await this.list()).filter((certificate) => certificate.published);
  }

  async findById(id: string) {
    return this.records.get(id) ?? null;
  }

  async findByUrl(certificateUrl: string) {
    return [...this.records.values()].find((certificate) => certificate.certificateUrl === certificateUrl) ?? null;
  }

  async create(certificate: Omit<Certificate, "id" | "createdAt" | "updatedAt">) {
    const now = new Date();
    const record = { ...certificate, id: `certificate-${this.records.size + 1}`, createdAt: now, updatedAt: now };
    this.records.set(record.id, record);
    return record;
  }

  async update(id: string, certificate: Partial<Omit<Certificate, "id" | "createdAt" | "updatedAt">>) {
    const current = this.records.get(id);
    if (!current) return null;
    const saved = { ...current, ...certificate, updatedAt: new Date() };
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
    return {
      mediaType: "raw",
      url: "https://res.cloudinary.com/demo/raw/upload/certificate.pdf",
      publicId: "certificate-pdf"
    };
  }

  async delete(publicId: string): Promise<void> {
    this.deleted.push(publicId);
  }
}

const input = {
  title: "Startup India Recognition",
  issuer: "DPIIT",
  description: "Recognition certificate",
  published: true,
  file: { buffer: Buffer.from("%PDF-1.4"), fileName: "certificate.pdf", mimeType: "application/pdf" }
};

describe("certificate use cases", () => {
  it("returns no public certificates when no records exist", async () => {
    const certificates = await new ListPublishedCertificatesUseCase(new FakeCertificateRepository()).execute();

    expect(certificates).toEqual([]);
  });

  it("creates PDF certificates", async () => {
    const certificate = await new CreateCertificateUseCase(new FakeCertificateRepository(), new FakeStorage()).execute(input);

    expect(certificate.certificateUrl).toContain("certificate.pdf");
    expect(certificate.published).toBe(true);
  });

  it("rejects non-PDF uploads", async () => {
    await expect(
      new CreateCertificateUseCase(new FakeCertificateRepository(), new FakeStorage()).execute({
        ...input,
        file: { buffer: Buffer.from([1, 2, 3]), fileName: "certificate.png", mimeType: "image/png" }
      })
    ).rejects.toThrow("Certificates must be uploaded as PDF files.");
  });

  it("updates metadata and replaces stored PDFs", async () => {
    const repo = new FakeCertificateRepository();
    const storage = new FakeStorage();
    const created = await repo.create({
      title: "Old",
      issuer: "Issuer",
      description: "",
      certificateUrl: "https://example.com/old.pdf",
      certificatePublicId: "old-pdf",
      displayOrder: 0,
      published: true
    });

    const updated = await new UpdateCertificateUseCase(repo, storage).execute(created.id, { title: "Updated", file: input.file });

    expect(updated.title).toBe("Updated");
    expect(updated.certificatePublicId).toBe("certificate-pdf");
    expect(storage.deleted).toEqual(["old-pdf"]);
  });

  it("deletes the certificate and stored PDF", async () => {
    const repo = new FakeCertificateRepository();
    const storage = new FakeStorage();
    const created = await repo.create({
      title: "Certificate",
      issuer: "Issuer",
      description: "",
      certificateUrl: "https://example.com/certificate.pdf",
      certificatePublicId: "stored-pdf",
      displayOrder: 0,
      published: true
    });

    await new DeleteCertificateUseCase(repo, storage).execute(created.id);

    expect(await repo.findById(created.id)).toBeNull();
    expect(storage.deleted).toEqual(["stored-pdf"]);
  });
});
