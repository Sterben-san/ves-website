import { PublicHeader as Header } from "../components/PublicHeader";
import { Footer } from "../components/Footer";
import { Team } from "../components/Team";
import { getMediaMap } from "@/lib/media";
import { getActiveTeamMembers } from "@/lib/content";
import { company } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const [media, teamMembers] = await Promise.all([getMediaMap(), getActiveTeamMembers()]);

  return (
    <>
      <Header />
      <main>
        <section className="bg-ves-black text-ves-paper">
          <div className="section-shell">
            <p className="eyebrow text-ves-lime">Contact</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-[1.06] text-ves-lime md:text-6xl">Start a field conversation with VES</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-ves-paper/78">
              You can find us at Azamnagar, Bhupalpally, or reach the team directly for streetlight automation, public infrastructure, internships, and field deployment discussions.
            </p>
          </div>
        </section>

        <section className="bg-ves-field">
          <div className="section-shell grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded border border-ves-leaf/20 bg-ves-cream p-7 shadow-soft">
              <p className="eyebrow">Details</p>
              <div className="mt-6 grid gap-4 text-sm font-bold text-ves-text/72">
                <p><span className="block text-xs uppercase tracking-[0.1em] text-ves-leaf">Company</span>{company.name}</p>
                <p><span className="block text-xs uppercase tracking-[0.1em] text-ves-leaf">Location</span>{company.location}</p>
                <a className="focus-ring" href={`mailto:${company.email}`}><span className="block text-xs uppercase tracking-[0.1em] text-ves-leaf">Email</span>{company.email}</a>
                <a className="focus-ring" href={`tel:${company.phone.replace(/\s+/g, "")}`}><span className="block text-xs uppercase tracking-[0.1em] text-ves-leaf">Phone</span>{company.phone}</a>
                <a className="focus-ring" href={`tel:${company.alternatePhone.replace(/\s+/g, "")}`}><span className="block text-xs uppercase tracking-[0.1em] text-ves-leaf">Alternate Phone</span>{company.alternatePhone}</a>
                <p><span className="block text-xs uppercase tracking-[0.1em] text-ves-leaf">Registration</span>{company.registrationNumber}</p>
                <a className="focus-ring rounded bg-ves-leaf px-4 py-3 text-center font-extrabold text-white" href={company.map} rel="noreferrer" target="_blank">
                  Open Azamnagar Map
                </a>
              </div>
            </div>

            <form className="grid gap-4 rounded border border-ves-leaf/20 bg-ves-cream p-7 shadow-soft" action={`mailto:${company.email}`} method="post" encType="text/plain">
              <div>
                <p className="eyebrow">Message</p>
                <h2 className="mt-3 text-3xl font-extrabold leading-[1.12] text-ves-text">Share your village, road, sand reach, or public-lighting requirement.</h2>
                <p className="mt-3 leading-7 text-ves-text/70">
                We will help assess the public-lighting cluster, control model, installation scope, service warranty needs, and the most practical next step.
                </p>
              </div>
              <label className="grid gap-1 text-sm font-extrabold text-ves-text">
                Name
                <input className="focus-ring rounded border border-ves-leaf/20 px-3 py-3 font-semibold" name="NAME" required />
              </label>
              <label className="grid gap-1 text-sm font-extrabold text-ves-text">
                Email
                <input className="focus-ring rounded border border-ves-leaf/20 px-3 py-3 font-semibold" name="EMAIL" type="email" required />
              </label>
              <label className="grid gap-1 text-sm font-extrabold text-ves-text">
                Message
                <textarea className="focus-ring min-h-36 rounded border border-ves-leaf/20 px-3 py-3 font-semibold leading-7" name="MESSAGE" required />
              </label>
              <button className="ves-button focus-ring bg-ves-leaf text-white hover:bg-ves-ink">
                Send Message
              </button>
            </form>
          </div>
        </section>

        <Team members={teamMembers} />

        <section className="bg-ves-mist">
          <div className="section-shell grid gap-5 md:grid-cols-3">
            {[
              ["Streetlight automation", "Automatic control boxes for switching public lights on and off at the right time, reducing waste and repair burden."],
              ["High mast lighting", "Complete procurement, transport, installation, testing, and handover for large-area illumination projects."],
              ["B2G and B2C automation", "Government infrastructure contracts and affordable smart automation products for rural and urban consumers."]
            ].map(([title, copy]) => (
              <article className="rounded border border-ves-leaf/20 bg-ves-cream p-7 shadow-soft" key={title}>
                <h2 className="text-2xl font-extrabold text-ves-text">{title}</h2>
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
