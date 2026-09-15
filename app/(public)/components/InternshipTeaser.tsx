import Link from "next/link";
import type { InternshipUpdate } from "@/server/domain/entities";

export function InternshipTeaser({ internships }: { internships: InternshipUpdate[] }) {
  if (internships.length === 0) return null;

  return (
    <section id="internship-list" className="bg-ves-mist">
      <div className="section-shell">
        <div className="grid gap-6 rounded border border-ves-leaf/20 bg-ves-cream p-8 shadow-soft md:grid-cols-[1.2fr_0.8fr] md:p-10">
          <div>
            <p className="eyebrow">Internships</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-[1.1] text-ves-text md:text-4xl">Students and young builders can follow active VES announcements.</h2>
          </div>
          <div className="md:text-right">
            <p className="font-semibold text-ves-text/68">
              {`${internships.length} active posting${internships.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
        {internships.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {internships.map((internship) => (
              <article className="rounded border border-ves-leaf/20 bg-ves-cream p-6 shadow-soft" key={internship.id}>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded bg-ves-lime px-2 py-1 text-xs font-extrabold uppercase text-ves-black">Active</span>
                  {internship.location ? <span className="rounded bg-ves-field px-2 py-1 text-xs font-extrabold uppercase text-ves-text/70">{internship.location}</span> : null}
                </div>
                <h3 className="mt-4 text-2xl font-extrabold leading-[1.12] text-ves-text">{internship.title}</h3>
                <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-ves-text/70">{internship.description}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {internship.applyUrl ? (
                    <a className="focus-ring rounded bg-ves-leaf px-4 py-2 text-sm font-extrabold text-white" href={internship.applyUrl} target="_blank" rel="noreferrer">
                      Apply
                    </a>
                  ) : null}
                  {internship.applyEmail ? (
                    <a className="focus-ring rounded border border-ves-leaf/25 px-4 py-2 text-sm font-extrabold text-ves-text" href={`mailto:${internship.applyEmail}`}>
                      Apply by Email
                    </a>
                  ) : null}
                  {internship.attachmentUrl ? (
                    <Link className="focus-ring rounded border border-ves-leaf/25 px-4 py-2 text-sm font-extrabold text-ves-text" href={internship.attachmentUrl} target="_blank">
                      Attachment
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
