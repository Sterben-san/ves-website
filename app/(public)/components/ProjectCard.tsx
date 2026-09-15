import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/server/domain/entities";

export function ProjectCard({ project, index, large = false, compact = false }: { project: Project; index: number; large?: boolean; compact?: boolean }) {
  return (
    <Link className={`focus-ring group block overflow-hidden rounded border border-ves-leaf/20 bg-ves-cream shadow-soft transition hover:-translate-y-1 hover:border-ves-leaf ${large ? "lg:grid lg:grid-cols-[1fr_1.05fr]" : compact ? "md:grid md:grid-cols-[0.72fr_1fr]" : ""}`} href={`/projects/${project.slug}`}>
      <div className={`relative overflow-hidden bg-ves-black ${large ? "min-h-[280px] lg:min-h-full" : compact ? "h-44 md:h-full md:min-h-48" : "h-48"}`}>
        {project.coverUrl ? (
          <Image src={project.coverUrl} alt={`${project.title} cover`} fill sizes={large ? "(min-width: 1024px) 42vw, 100vw" : "(min-width: 768px) 33vw, 100vw"} className="object-cover transition duration-500 group-hover:scale-105" />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,10,0.04),rgba(8,11,10,0.72))]" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-sm font-extrabold text-ves-lime">{String(index + 1).padStart(2, "0")}</p>
          {project.category ? <p className="mt-2 text-xs font-extrabold uppercase tracking-[0.08em] text-ves-paper/82">{project.category}</p> : null}
        </div>
      </div>
      <div className={`${compact ? "p-5" : "p-5 md:p-6"}`}>
        <h3 className={`${large ? "text-3xl md:text-4xl" : compact ? "text-lg md:text-xl" : "text-xl"} font-extrabold leading-[1.12] text-ves-text`}>{project.title}</h3>
        {project.location ? <p className="mt-3 text-sm font-bold text-ves-leaf">{project.location}</p> : null}
        <p className={`mt-4 text-sm font-medium leading-7 text-ves-text/70 ${large ? "md:text-base" : compact ? "line-clamp-4" : "md:text-base"}`}>{project.summary}</p>
        <span className="mt-5 inline-flex text-sm font-extrabold text-ves-leaf">Open project details</span>
      </div>
    </Link>
  );
}
