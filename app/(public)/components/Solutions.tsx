import type { Project } from "@/server/domain/entities";
import { SolutionsProjectExplorer } from "./SolutionsProjectExplorer";

export function Solutions({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;

  return (
    <section id="solutions" className="bg-ves-field">
      <div className="section-shell">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="eyebrow">Solutions & Field Work</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-[1.08] text-ves-text md:text-5xl">
              One operating story: what VES builds and where it works
            </h2>
          </div>
          <p className="text-base leading-8 text-ves-text/72 md:text-lg">
            VES brings control boxes, streetlight automation, high mast lighting, and field support into one delivery model for government bodies, rural communities, sand reaches, roads, and consumer automation needs.
          </p>
        </div>

        <SolutionsProjectExplorer projects={projects} />
      </div>
    </section>
  );
}
