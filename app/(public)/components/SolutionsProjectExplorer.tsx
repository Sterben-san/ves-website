import Link from "next/link";
import type { Project } from "@/server/domain/entities";
import { ProjectCard } from "./ProjectCard";

export function SolutionsProjectExplorer({ projects }: { projects: Project[] }) {
  const visibleProjects = projects.slice(0, 3);
  const hasMoreProjects = projects.length > visibleProjects.length;

  if (visibleProjects.length === 0) {
    return (
      <div className="mt-12 rounded border border-ves-leaf/20 bg-ves-cream p-8 shadow-soft md:p-10">
        <p className="eyebrow">Project Records</p>
        <h3 className="mt-3 text-2xl font-extrabold leading-[1.12] text-ves-text md:text-3xl">Field-work records are being prepared.</h3>
        <p className="mt-4 max-w-2xl text-base font-medium leading-8 text-ves-text/70">
          Published VES project cards will appear here after the admin team adds the project heading, summary, cover image, and publishing status.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a className="ves-button focus-ring bg-ves-leaf text-white hover:bg-ves-ink" href="#contact">
            Discuss Deployment
          </a>
          <Link className="ves-button focus-ring border border-ves-leaf/25 text-ves-text hover:border-ves-leaf" href="/projects">
            View Projects Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-12 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)_52px]">
        <ProjectCard project={visibleProjects[0]} index={0} large />

        <div className="grid gap-5">
          {visibleProjects.slice(1).map((project, index) => (
            <ProjectCard compact project={project} index={index + 1} key={project.id} />
          ))}
        </div>

        <div className="hidden lg:flex lg:items-center lg:justify-center">
          {hasMoreProjects ? (
            <Link
              aria-label="View more projects"
              className="focus-ring grid h-12 w-12 place-items-center rounded-full bg-ves-leaf text-xl font-black text-white shadow-soft transition hover:bg-ves-ink"
              href="/projects"
            >
              →
            </Link>
          ) : (
            <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-full bg-ves-leaf/35 text-xl font-black text-white shadow-soft">
              →
            </span>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <a className="ves-button focus-ring bg-ves-leaf text-white hover:bg-ves-ink" href="#contact">
          Discuss Deployment
        </a>
        <div className="lg:hidden">
          {hasMoreProjects ? (
            <Link
              aria-label="View more projects"
              className="focus-ring grid h-12 w-12 place-items-center rounded-full bg-ves-leaf text-xl font-black text-white shadow-soft transition hover:bg-ves-ink"
              href="/projects"
            >
              →
            </Link>
          ) : (
            <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-full bg-ves-leaf/35 text-xl font-black text-white shadow-soft">
              →
            </span>
          )}
        </div>
      </div>
    </>
  );
}
