import { getMediaMap } from "@/lib/media";
import { getSocialLinks } from "@/lib/content";
import { PublicHeader as Header } from "../components/PublicHeader";
import { Footer } from "../components/Footer";
import { SocialEmbed } from "../components/SocialEmbed";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const [links, media] = await Promise.all([getSocialLinks(), getMediaMap()]);

  return (
    <>
      <Header />
      <main>
        <section className="bg-ves-black text-ves-paper">
          <div className="section-shell pb-16 pt-20">
            <p className="eyebrow text-ves-lime">Social</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.06] text-ves-lime md:text-6xl">Follow VES public posts.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ves-paper/72">
              Public Instagram and LinkedIn posts shared by the VES team.
            </p>
          </div>
        </section>
        <section className="bg-ves-mist">
          <div className="section-shell">
            {links.length > 0 ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {links.map((link) => (
                  <SocialEmbed caption={link.caption} platform={link.platform} postUrl={link.postUrl} key={link.id} />
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-ves-cream px-5 py-8 text-center font-semibold text-ves-ink/60">No social links have been added yet.</p>
            )}
          </div>
        </section>
      </main>
      <Footer media={media} />
    </>
  );
}
