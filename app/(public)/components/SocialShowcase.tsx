import type { SectionCopy, SocialLink } from "@/server/domain/entities";
import { SocialEmbed } from "./SocialEmbed";

export function SocialShowcase({ copy, links }: { copy?: SectionCopy; links: SocialLink[] }) {
  if (links.length === 0 || copy?.visible === false) return null;

  return (
    <section id="social" className="bg-ves-field">
      <div className="section-shell">
        <div>
          <div>
            <p className="eyebrow">{copy?.eyebrow || "Follow"}</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-[1.08] text-ves-text md:text-5xl">{copy?.title || "Follow VES public posts."}</h2>
            {copy?.body ? <p className="mt-4 max-w-3xl text-base leading-8 text-ves-text/70 md:text-lg">{copy.body}</p> : null}
          </div>
        </div>
        {links.length > 0 ? (
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {links.slice(0, 4).map((link) => (
              <SocialEmbed caption={link.caption} platform={link.platform} postUrl={link.postUrl} key={link.id} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
