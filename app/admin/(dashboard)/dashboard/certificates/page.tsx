import { getAllCertificatesForAdmin } from "@/lib/content";
import type { Certificate } from "@/server/domain/entities";
import { CertificateDashboardClient, type AdminCertificate } from "./CertificateDashboardClient";

export const dynamic = "force-dynamic";

export default async function CertificatesDashboardPage() {
  const certificates = await getAllCertificatesForAdmin();

  return (
    <div>
      <div className="border-b border-slate-200 pb-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-ves-leaf">Certificates</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Certification PDF manager</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">
          Upload certificate PDFs, edit their public information, and choose which records appear on the homepage.
        </p>
      </div>
      <CertificateDashboardClient initialCertificates={certificates.map(serializeCertificate)} />
    </div>
  );
}

function serializeCertificate(certificate: Certificate): AdminCertificate {
  return {
    ...certificate,
    issuedOn: certificate.issuedOn?.toISOString(),
    createdAt: certificate.createdAt.toISOString(),
    updatedAt: certificate.updatedAt.toISOString()
  };
}
