import { PublicHeader as Header } from "../components/PublicHeader";
import { Footer } from "../components/Footer";
import { ProjectCard } from "../components/ProjectCard";
import Image from "next/image";
import { getMediaMap } from "@/lib/media";
import { getPublishedProjects } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [media, projects] = await Promise.all([getMediaMap(), getPublishedProjects()]);

  return (
    <>
      <Header />
      <main>
        <section className="bg-ves-black text-ves-paper">
          <div className="section-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="eyebrow text-ves-lime">Projects</p>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.06] text-ves-lime md:text-6xl">District-approved lighting work in the field</h1>
              <p className="mt-6 text-lg leading-8 text-ves-paper/78">
                Published VES projects appear here only after the admin team completes the required title, cover image, and summary fields.
              </p>
            </div>
            <div className="relative min-h-[340px] overflow-hidden rounded border border-ves-leaf/25 bg-ves-deep">
              <Image src="/placeholders/autonomous-light.svg" alt="" fill className="object-cover" />
            </div>
          </div>
        </section>

        <section className="bg-ves-field">
          <div className="section-shell">
            {projects.length > 0 ? (
              <div className="grid gap-6">
                {projects.map((project, index) => (
                  <ProjectCard project={project} index={index} large key={project.id} />
                ))}
              </div>
            ) : (
              <div className="rounded border border-ves-leaf/20 bg-ves-cream p-8 text-center shadow-soft">
                <h2 className="text-2xl font-extrabold text-ves-text">No projects published yet.</h2>
                <p className="mt-3 text-ves-text/70">Draft project slots stay hidden until an admin fills the required details and publishes them.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer media={media} />
    </>
  );
}
