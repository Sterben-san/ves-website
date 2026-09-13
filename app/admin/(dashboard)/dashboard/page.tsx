import Link from "next/link";
import { createContainer } from "@/server/config/container";

export const dynamic = "force-dynamic";

export default async function AdminDashboardIndex() {
  const summary = await createContainer().getAdminHomepageSummary.execute();

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-ves-leaf">Homepage Overview</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Public site control center</h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-500">
            These are the admin-managed records currently feeding the public homepage.
          </p>
        </div>
        <Link className="focus-ring rounded bg-ves-ink px-4 py-2 text-sm font-black text-white" href="/" target="_blank">
          View Homepage
        </Link>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          eyebrow="Hero"
          href="/admin/dashboard/announcements"
          label={summary.pinnedAnnouncement ? "Pinned announcement" : "No pinned hero"}
          value={summary.pinnedAnnouncement?.title ?? "Fallback hero"}
        />
        <SummaryCard
          eyebrow="Updates"
          href="/admin/dashboard/homepage-news"
          label={`${summary.publishedAnnouncementCount} published · ${summary.draftAnnouncementCount} drafts`}
          value="Homepage News"
        />
        <SummaryCard
          eyebrow="Internships"
          href="/admin/dashboard/internships"
          label={`${summary.activeInternshipCount} active`}
          value={`${summary.totalInternshipCount} total postings`}
        />
        <SummaryCard
          eyebrow="Projects"
          href="/admin/dashboard/projects"
          label="Featured cards and project drafts"
          value="Project CMS"
        />
        <SummaryCard
          eyebrow="Certificates"
          href="/admin/dashboard/certificates"
          label="PDF records and public visibility"
          value="Certificates"
        />
        <SummaryCard
          eyebrow="Team"
          href="/admin/dashboard/team"
          label="Photos, emails, LinkedIn, social handles"
          value="Contact card CMS"
        />
        <SummaryCard
          eyebrow="Process"
          href="/admin/dashboard/field-process"
          label="Five homepage journey boxes"
          value="Field Process"
        />
        <SummaryCard
          eyebrow="Social"
          href="/admin/dashboard/social"
          label={`${summary.featuredSocialCount}/4 featured`}
          value={`${summary.totalSocialCount} total links`}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950">Latest homepage updates</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">The homepage News section has its own cards, layout controls, and slow marquee.</p>
            </div>
            <Link className="focus-ring rounded border border-slate-200 px-3 py-2 text-sm font-black" href="/news" target="_blank">
              View News
            </Link>
          </div>
          <div className="mt-5 grid gap-3">
            {summary.recentAnnouncements.length > 0 ? (
              summary.recentAnnouncements.map((announcement) => (
                <article className="rounded border border-slate-100 bg-slate-50 p-4" key={announcement.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-ves-lime px-2 py-1 text-xs font-black uppercase text-ves-ink">{announcement.kind}</span>
                    {announcement.pinned ? <span className="rounded bg-slate-900 px-2 py-1 text-xs font-black uppercase text-white">Pinned</span> : null}
                  </div>
                  <h3 className="mt-3 font-black text-slate-950">{announcement.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">{announcement.body}</p>
                </article>
              ))
            ) : (
              <p className="rounded bg-slate-50 p-4 text-sm font-semibold text-slate-500">No published announcements yet.</p>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Section media</h2>
            <p className="mt-2 text-3xl font-black text-ves-leaf">
              {summary.customMediaSlotCount}/{summary.totalMediaSlotCount}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">slots replaced from defaults</p>
            {summary.missingAltTextSlots.length > 0 ? (
              <p className="mt-4 rounded bg-amber-50 p-3 text-sm font-bold text-amber-900">
                Missing alt text: {summary.missingAltTextSlots.join(", ")}
              </p>
            ) : (
              <p className="mt-4 rounded bg-emerald-50 p-3 text-sm font-bold text-emerald-900">All media records have alt text.</p>
            )}
            <Link className="focus-ring mt-4 inline-block rounded border border-slate-200 px-3 py-2 text-sm font-black" href="/admin/dashboard/media">
              Manage Media
            </Link>
          </div>

          <div className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Public placement</h2>
            <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-600">
              <p>Homepage News controls the section layout; Announcements provide the published cards.</p>
              <p>Active internships show a homepage teaser.</p>
              <p>Featured social links show near the footer.</p>
              <p>Section media replaces fixed homepage imagery.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ eyebrow, label, value, href }: { eyebrow: string; label: string; value: string; href: string }) {
  return (
    <Link className="focus-ring rounded border border-slate-200 bg-white p-5 shadow-sm transition hover:border-ves-leaf" href={href}>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-ves-leaf">{eyebrow}</p>
      <h2 className="mt-4 min-h-14 text-2xl font-black leading-tight text-slate-950">{value}</h2>
      <p className="mt-3 text-sm font-semibold text-slate-500">{label}</p>
    </Link>
  );
}
