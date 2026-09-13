import Image from "next/image";
import { getPublishedCertificates } from "@/lib/content";
import { getMediaMap } from "@/lib/media";
import { PublicHeader as Header } from "../components/PublicHeader";
import { Footer } from "../components/Footer";
import { certificateAnchor } from "../components/Certifications";

export const dynamic = "force-dynamic";

export default async function CertificationsPage() {
  const [certificates, media] = await Promise.all([getPublishedCertificates(), getMediaMap()]);

  return (
    <>
      <Header />
      <main>
        <section className="bg-ves-black text-ves-paper">
          <div className="section-shell">
            <p className="eyebrow text-ves-lime">Certifications</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-[1.06] text-ves-lime md:text-6xl">
              Official records supporting VES.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-ves-paper/78">
              Registration, recognition, and quality documents are collected here for clients, partners, and public-sector stakeholders to inspect quickly.
            </p>
          </div>
        </section>

        <section className="bg-ves-field">
          <div className="section-shell">
            {certificates.length > 0 ? (
              <div className="grid gap-6">
                {certificates.map((certificate) => (
                  <article
                    className="scroll-mt-28 overflow-hidden rounded border border-ves-leaf/20 bg-ves-cream shadow-soft lg:grid lg:grid-cols-[minmax(260px,0.72fr)_minmax(0,1fr)]"
                    id={certificateAnchor(certificate)}
                    key={certificate.id}
                  >
                    <a className="focus-ring block bg-white p-4" href={certificate.certificateUrl} target="_blank" rel="noreferrer">
                      <Image
                        className="mx-auto h-[420px] w-full object-contain"
                        src={certificate.previewUrl ?? "/placeholders/project.svg"}
                        alt={`${certificate.title} preview`}
                        width={420}
                        height={560}
                        loading="lazy"
                        unoptimized
                      />
                    </a>
                    <div className="p-7">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-ves-lime px-2 py-1 text-xs font-black uppercase text-ves-black">{certificate.issuer}</span>
                        {certificate.issuedOn ? (
                          <span className="text-xs font-bold text-ves-text/55">{new Date(certificate.issuedOn).toLocaleDateString()}</span>
                        ) : null}
                      </div>
                      <h2 className="mt-5 text-3xl font-extrabold leading-tight text-ves-text">{certificate.title}</h2>
                      <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-ves-text/68">{certificate.description}</p>
                      <a className="focus-ring mt-6 inline-flex rounded bg-ves-ink px-4 py-2 text-sm font-black text-white" href={certificate.certificateUrl} target="_blank" rel="noreferrer">
                        Open PDF
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded border border-ves-leaf/20 bg-ves-cream p-8 text-center shadow-soft">
                <h2 className="text-2xl font-extrabold text-ves-text">No certificates published yet.</h2>
                <p className="mt-3 text-ves-text/70">Certificates appear here once the admin team publishes them.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer media={media} />
    </>
  );
}
