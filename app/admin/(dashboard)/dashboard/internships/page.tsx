import { getAllInternshipsForAdmin } from "@/lib/content";
import type { InternshipUpdate } from "@/server/domain/entities";
import { InternshipDashboardClient, type AdminInternship } from "./InternshipDashboardClient";

export const dynamic = "force-dynamic";

export default async function InternshipsDashboardPage() {
  const internships = await getAllInternshipsForAdmin();

  return (
    <div>
      <div className="border-b border-slate-200 pb-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-ves-leaf">Internships</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Internship announcements</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">Publish simple openings with location, contact, and optional attachments. Inactive postings stay hidden publicly.</p>
      </div>
      <InternshipDashboardClient initialInternships={internships.map(serializeInternship)} />
    </div>
  );
}

function serializeInternship(internship: InternshipUpdate): AdminInternship {
  return {
    ...internship,
    createdAt: internship.createdAt.toISOString(),
    updatedAt: internship.updatedAt.toISOString()
  };
}
