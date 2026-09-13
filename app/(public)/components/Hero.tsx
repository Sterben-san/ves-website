import type { MediaMap } from "@/lib/media";
import { getMedia } from "@/lib/media";
import { company, corePromise } from "@/lib/siteContent";
import { HeroBackgroundPlayer } from "./HeroBackgroundPlayer";

export function Hero({ media }: { media: MediaMap }) {
  const heroBackground = getMedia(media, "hero.bg");

  return (
    <section className="relative isolate overflow-hidden bg-ves-black text-ves-paper">
      <HeroBackgroundPlayer media={heroBackground} />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,11,10,0.92),rgba(8,11,10,0.72)_48%,rgba(8,11,10,0.42))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(242,201,76,0.18),transparent_32%)]" />
      <div className="relative z-10 mx-auto grid max-w-[980px] items-center px-6 py-14 sm:py-16 lg:min-h-[calc(100vh-80px)] lg:py-20">
        <div className="max-w-3xl">
          <div className="flex flex-wrap gap-3 text-xs font-extrabold uppercase tracking-[0.14em] text-ves-lime">
            <span>Streetlight Automation</span>
            <span className="text-ves-paper/35">Est. Dec 2024</span>
          </div>
          <h1 className="mt-5 max-w-[12ch] text-4xl font-extrabold leading-[1.02] text-ves-lime sm:text-5xl md:text-6xl lg:text-7xl">
            {company.tagline}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-ves-paper/78 sm:text-lg">
            {corePromise}
          </p>
          <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-ves-paper/52">
            Smart systems that conserve energy, reduce costs, and enhance public infrastructure.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 sm:mt-9 sm:gap-4">
            <a className="ves-button focus-ring bg-ves-lime text-ves-black hover:bg-ves-paper" href="#contact">
              Contact VES
            </a>
            <a className="ves-button focus-ring border border-ves-lime/35 bg-transparent text-ves-paper hover:border-ves-paper hover:text-ves-lime" href="#solutions">
              Explore Systems
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
