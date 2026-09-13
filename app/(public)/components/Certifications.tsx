import Image from "next/image";
import type { CSSProperties } from "react";
import type { Certificate } from "@/server/domain/entities";

export function Certifications({ certificates }: { certificates: Certificate[] }) {
  if (certificates.length === 0) return null;

  const marqueeItems = [...certificates, ...certificates];
  const certificateGap = certificates.length <= 3 ? 112 : certificates.length <= 6 ? 68 : 34;

  return (
    <section id="certifications-preview" className="bg-ves-ink text-ves-paper">
      <div className="section-shell">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="eyebrow text-ves-lime">Certifications</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-[1.08] text-white md:text-5xl">
              Verified records, quick to inspect.
            </h2>
          </div>
          <p className="text-base leading-8 text-ves-paper/72 md:text-lg">
            Tap any certificate preview to open the full certifications page at the matching record.
          </p>
        </div>

        <div className="ves-cert-marquee mt-10" style={{ "--certificate-gap": `${certificateGap}px` } as CSSProperties} aria-label="Moving certificate previews">
          <div className="ves-cert-track">
            {marqueeItems.map((certificate, index) => (
              <a className="ves-cert-image-card focus-ring" href={`/certifications#${certificateAnchor(certificate)}`} key={`${certificate.id}-${index}`}>
                <Image
                  src={certificate.previewUrl ?? "/placeholders/project.svg"}
                  alt={`${certificate.title} certificate preview`}
                  width={420}
                  height={280}
                  loading="lazy"
                  unoptimized
                />
                <span>{certificate.title}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function certificateAnchor(certificate: Pick<Certificate, "title" | "id">) {
  const slug = certificate.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `certificate-${slug || certificate.id.replace(/[^a-z0-9]+/gi, "-")}`;
}
