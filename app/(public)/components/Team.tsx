import Image from "next/image";
import type { TeamMember, TeamSocialPlatform } from "@/server/domain/entities";

export function Team({ members }: { members: TeamMember[] }) {
  if (members.length === 0) return null;

  return (
    <section id="team" className="bg-ves-field">
      <div className="section-shell">
        <p className="eyebrow">Team</p>
        <h2 className="mt-4 text-3xl font-extrabold leading-[1.08] text-ves-text md:text-5xl">Contact cards for the people behind VES</h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-ves-text/70 md:text-lg">
          Reach the active VES team for field projects, operations, development, and public-lighting conversations.
        </p>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {members.map((member) => (
            <article className="rounded border border-ves-leaf/20 bg-ves-cream p-5 shadow-soft" key={member.id}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-ves-black">
                {member.photoUrl ? (
                  <Image src={member.photoUrl} alt={`${member.fullName} profile photo`} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                ) : (
                  <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_35%_20%,rgba(240,198,78,0.28),transparent_35%),linear-gradient(135deg,#07100d,#174b35)] text-5xl font-black text-ves-lime">
                    {initials(member.fullName)}
                  </div>
                )}
              </div>
              <h3 className="mt-5 text-2xl font-extrabold leading-[1.12] text-ves-text">{member.fullName}</h3>
              <p className="mt-1 text-sm font-semibold text-ves-leaf md:text-base">{member.role}</p>
              {member.bio ? <p className="mt-4 line-clamp-4 text-sm font-medium leading-6 text-ves-text/70">{member.bio}</p> : null}
              <div className="mt-5 grid gap-2 text-sm font-bold text-ves-text/75">
                <a className="focus-ring rounded transition hover:text-ves-leaf" href={`mailto:${member.email}`}>
                  {member.email}
                </a>
                {member.phone ? (
                  <a className="focus-ring rounded transition hover:text-ves-leaf" href={`tel:${member.phone.replace(/\s+/g, "")}`}>
                    {member.phone}
                  </a>
                ) : null}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <SocialPill platform="linkedin" url={member.linkedinUrl} />
                {member.socials.map((social) => (
                  <SocialPill key={`${member.id}-${social.platform}-${social.url}`} platform={social.platform} url={social.url} />
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function SocialPill({ platform, url }: { platform: TeamSocialPlatform; url: string }) {
  return (
    <a
      className="focus-ring rounded border border-ves-leaf/20 bg-white/70 px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] text-ves-leaf transition hover:border-ves-leaf hover:bg-ves-leaf hover:text-white"
      href={url}
      rel="noreferrer"
      target="_blank"
    >
      {platformLabel(platform)}
    </a>
  );
}

function platformLabel(platform: TeamSocialPlatform) {
  if (platform === "x") return "X";
  return platform;
}
