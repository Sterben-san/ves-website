import { getAllProjectsForAdmin } from "@/lib/content";
import type { Project } from "@/server/domain/entities";
import { ProjectDashboardClient, type AdminProject } from "./ProjectDashboardClient";

export const dynamic = "force-dynamic";

export default async function ProjectsDashboardPage() {
  const projects = await getAllProjectsForAdmin();

  return (
    <div>
      <div className="border-b border-slate-200 pb-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-ves-leaf">Projects</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Project card CMS</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">Manage homepage featured projects, the full projects page, draft slots, cover images, and publication state.</p>
      </div>
      <ProjectDashboardClient initialProjects={projects.map(serializeProject)} />
    </div>
  );
}

function serializeProject(project: Project): AdminProject {
  return {
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
  };
}
