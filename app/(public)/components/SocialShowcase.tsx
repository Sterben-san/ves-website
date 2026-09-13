import type { SocialLink } from "@/server/domain/entities";
import { SocialEmbed } from "./SocialEmbed";

export function SocialShowcase({ links }: { links: SocialLink[] }) {
  if (links.length === 0) return null;

  return (
    <section id="social" className="bg-ves-field">
      <div className="section-shell">
        <div>
          <div>
            <p className="eyebrow">Follow</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-[1.08] text-ves-text md:text-5xl">Follow VES public posts.</h2>
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
