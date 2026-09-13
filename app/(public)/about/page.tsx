import { PublicHeader as Header } from "../components/PublicHeader";
import { Footer } from "../components/Footer";
import { MediaAsset } from "../components/MediaAsset";
import { Team } from "../components/Team";
import { getMedia, getMediaMap } from "@/lib/media";
import { getActiveTeamMembers } from "@/lib/content";
import { company, mission, principles } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [media, teamMembers] = await Promise.all([getMediaMap(), getActiveTeamMembers()]);

  return (
    <>
      <Header />
      <main>
        <section className="bg-ves-black text-ves-paper">
          <div className="section-shell grid gap-10 md:grid-cols-[1fr_0.85fr] md:items-end">
            <div>
              <p className="eyebrow text-ves-lime">About</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-[1.06] text-ves-lime md:text-6xl">Smart lighting built from local field reality</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-ves-paper/78">
                {company.name} builds practical, deployable infrastructure technology for local governments and rural communities, starting with automatic public street lighting.
              </p>
            </div>
            <div className="relative min-h-[320px] overflow-hidden rounded border border-ves-leaf/25 bg-ves-deep">
              <MediaAsset media={getMedia(media, "about.image")} className="object-cover" />
            </div>
          </div>
        </section>

        <section className="bg-ves-field">
          <div className="section-shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="eyebrow">What is VES?</p>
              <h2 className="mt-4 text-3xl font-extrabold leading-[1.08] text-ves-text md:text-5xl">A field-ready model for accountable illumination</h2>
            </div>
            <div className="grid gap-5 text-lg leading-8 text-ves-text/72">
              <p>
                VES was founded around a municipal problem: streetlights that operate 24 hours a day waste electricity, burn out at a high rate, and create repair costs that local governments must keep absorbing.
              </p>
              <p>
                The company believes rural and semi-urban infrastructure does not need expensive imported platforms first. It needs simple, rugged automation that fits local budgets and can be installed and serviced by an accountable local team.
              </p>
              <p className="font-extrabold text-ves-leaf">{mission}</p>
            </div>
          </div>
        </section>

        <section className="bg-ves-mist">
          <div className="section-shell">
            <p className="eyebrow">Purpose</p>
            <h2 className="mt-4 max-w-3xl text-3xl font-extrabold leading-[1.08] text-ves-text md:text-5xl">Make rural infrastructure safer, cleaner, and easier to operate</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {principles.map(([number, title, copy]) => (
                <article className="rounded border border-ves-leaf/20 bg-ves-cream p-7 shadow-soft" key={title}>
                  <p className="text-sm font-extrabold text-ves-lime">{number}</p>
                  <h3 className="mt-4 text-xl font-extrabold uppercase text-ves-text">{title}</h3>
                  <p className="mt-3 leading-7 text-ves-text/70">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <Team members={teamMembers} />

        <section className="bg-ves-field">
          <div className="section-shell grid gap-5 md:grid-cols-3">
            {[
              ["Bhupalpally", "District streetlight automation", "Government-approved automatic control boxes addressing always-on lighting, repair burden, and illegal electricity usage."],
              ["Telangana", "Sand bazaar lighting", "High mast lighting and visibility upgrades for loading zones, vehicle movement, and night operations."],
              ["Field Sites", "Deployment support", "Site assessment, commissioning checks, maintenance planning, and one-year service warranty support after handover."]
            ].map(([place, label, copy]) => (
              <article className="rounded border border-ves-leaf/20 bg-ves-cream p-7 shadow-soft" key={place}>
                <p className="eyebrow">{place}</p>
                <h3 className="mt-3 text-2xl font-extrabold text-ves-text">{label}</h3>
                <p className="mt-4 leading-7 text-ves-text/70">{copy}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer media={media} />
    </>
  );
}
