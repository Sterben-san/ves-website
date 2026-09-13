import Link from "next/link";
import { getActiveInternships } from "@/lib/content";
import { getMediaMap } from "@/lib/media";
import { PublicHeader as Header } from "../components/PublicHeader";
import { Footer } from "../components/Footer";

export const dynamic = "force-dynamic";

export default async function InternshipsPage() {
  const [internships, media] = await Promise.all([getActiveInternships(), getMediaMap()]);

  return (
    <>
      <Header />
      <main>
        <section className="bg-ves-black text-ves-paper">
          <div className="section-shell pb-16 pt-20">
            <p className="eyebrow text-ves-lime">Internships</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.06] text-ves-lime md:text-6xl">Learn with VES field and product teams.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ves-paper/72">
              Students and young builders can follow active VES announcements and apply through the official form.
            </p>
          </div>
        </section>
        <section className="bg-ves-mist">
          <div className="section-shell">
            {internships.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2">
                {internships.map((internship) => (
                  <article className="rounded border border-ves-leaf/20 bg-ves-cream p-6 shadow-soft" key={internship.id}>
                    <div className="flex flex-wrap gap-2">
                      <p className="eyebrow">Active</p>
                      {internship.location ? <p className="rounded bg-ves-mist px-2 py-1 text-xs font-extrabold uppercase text-ves-ink/70">{internship.location}</p> : null}
                    </div>
                    <h2 className="mt-3 text-2xl font-extrabold text-ves-text">{internship.title}</h2>
                    <p className="mt-4 whitespace-pre-wrap leading-8 text-ves-text/72">{internship.description}</p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      {internship.applyUrl ? (
                        <a className="focus-ring inline-block rounded bg-ves-leaf px-4 py-2 font-extrabold text-white" href={internship.applyUrl} target="_blank" rel="noreferrer">
                          Apply
                        </a>
                      ) : null}
                      {internship.applyEmail ? (
                        <Link className="focus-ring inline-block rounded border border-ves-leaf/25 px-4 py-2 font-extrabold text-ves-text" href={`mailto:${internship.applyEmail}`}>
                          Apply by Email
                        </Link>
                      ) : null}
                      {internship.attachmentUrl ? (
                        <Link className="focus-ring inline-block rounded-full border border-ves-ink/20 px-4 py-2 font-extrabold text-ves-ink" href={internship.attachmentUrl} target="_blank">
                          View Attachment
                        </Link>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-ves-cream px-5 py-8 text-center font-semibold text-ves-ink/60">No active internships yet.</p>
            )}
          </div>
        </section>
      </main>
      <Footer media={media} />
    </>
  );
}
