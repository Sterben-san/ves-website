import Image from "next/image";
import { notFound } from "next/navigation";
import { PublicHeader as Header } from "../../components/PublicHeader";
import { Footer } from "../../components/Footer";
import { getMediaMap } from "@/lib/media";
import { getPublishedProject } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [media, project] = await Promise.all([getMediaMap(), getPublishedProject(slug)]);

  console.info("[project-detail-validation]", {
    slug,
    found: Boolean(project),
    published: project?.published ?? false,
    hasCover: Boolean(project?.coverUrl),
    galleryCount: project?.galleryImages.length ?? 0,
    hasMapUrl: Boolean(project?.mapUrl)
  });

  if (!project) notFound();

  const mapHref = project.mapUrl || (project.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.location)}` : undefined);
  const bodyParagraphs = project.body.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);

  return (
    <>
      <Header />
      <main>
        <section className="bg-ves-black text-ves-paper">
          <div className="section-shell grid gap-10 lg:grid-cols-[1fr_0.82fr] lg:items-end">
            <div>
              <p className="eyebrow text-ves-lime">{project.category || "Project"}</p>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.06] text-ves-lime md:text-6xl">{project.title}</h1>
              <p className="mt-6 max-w-3xl text-lg font-semibold leading-8 text-ves-paper/78">{project.summary}</p>
              {project.location ? <p className="mt-5 text-sm font-extrabold uppercase tracking-[0.12em] text-ves-paper/55">{project.location}</p> : null}
              {mapHref ? (
                <a className="ves-button focus-ring mt-7 inline-flex bg-ves-lime text-ves-black hover:bg-ves-paper" href={mapHref} rel="noreferrer" target="_blank">
                  Open Map Location
                </a>
              ) : null}
            </div>
            {project.coverUrl ? (
              <div className="relative min-h-[300px] overflow-hidden rounded border border-ves-leaf/25 bg-ves-deep shadow-soft">
                <Image src={project.coverUrl} alt={`${project.title} cover`} fill sizes="(min-width: 1024px) 38vw, 100vw" className="object-cover" priority />
              </div>
            ) : null}
          </div>
        </section>

        <section className="bg-ves-field">
          <div className="section-shell grid gap-10 lg:grid-cols-[0.72fr_1fr]">
            <aside className="rounded border border-ves-leaf/20 bg-ves-cream p-6 shadow-soft">
              <p className="eyebrow">Project Snapshot</p>
              <dl className="mt-5 grid gap-5 text-sm">
                <div>
                  <dt className="font-extrabold text-ves-text">Category</dt>
                  <dd className="mt-1 font-semibold text-ves-text/65">{project.category || "Field project"}</dd>
                </div>
                {project.location ? (
                  <div>
                    <dt className="font-extrabold text-ves-text">Location</dt>
                    <dd className="mt-1 font-semibold text-ves-text/65">{project.location}</dd>
                  </div>
                ) : null}
                {mapHref ? (
                  <div>
                    <dt className="font-extrabold text-ves-text">Map</dt>
                    <dd className="mt-2">
                      <a className="focus-ring font-extrabold text-ves-leaf" href={mapHref} rel="noreferrer" target="_blank">Open public map link</a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </aside>
            <article className="rounded border border-ves-leaf/20 bg-white p-6 shadow-soft md:p-8">
              <p className="eyebrow">Project Details</p>
              <div className="mt-5 grid gap-5 text-base font-medium leading-8 text-ves-text/72">
                {bodyParagraphs.length > 0 ? bodyParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>) : <p>{project.summary}</p>}
              </div>
            </article>
          </div>
        </section>

        {project.galleryImages.length > 0 ? (
          <section className="bg-ves-cream">
            <div className="section-shell">
              <div className="max-w-2xl">
                <p className="eyebrow">Project Images</p>
                <h2 className="mt-4 text-3xl font-extrabold leading-[1.08] text-ves-text md:text-5xl">Field photos and project references</h2>
              </div>
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {project.galleryImages.map((image) => (
                  <figure className="overflow-hidden rounded border border-ves-leaf/20 bg-white shadow-soft" key={image.publicId}>
                    <div className="relative aspect-[4/3] bg-ves-black">
                      <Image src={image.url} alt={image.altText || `${project.title} project image`} fill sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw" className="object-cover" />
                    </div>
                    {image.altText ? <figcaption className="p-4 text-sm font-bold text-ves-text/62">{image.altText}</figcaption> : null}
                  </figure>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <Footer media={media} />
    </>
  );
}
