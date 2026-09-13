import { getAllTeamMembersForAdmin } from "@/lib/content";
import type { TeamMember } from "@/server/domain/entities";
import { TeamDashboardClient, type AdminTeamMember } from "./TeamDashboardClient";

export const dynamic = "force-dynamic";

export default async function TeamDashboardPage() {
  const members = await getAllTeamMembersForAdmin();

  return (
    <div>
      <div className="border-b border-slate-200 pb-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-ves-leaf">Team</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Employee contact cards</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">Manage public team profiles, photos, contact details, links, visibility, and display order.</p>
      </div>
      <TeamDashboardClient initialMembers={members.map(serializeMember)} />
    </div>
  );
}

function serializeMember(member: TeamMember): AdminTeamMember {
  return {
    ...member,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString()
  };
}
