import { getMedia, type MediaMap } from "@/lib/media";
import { aboutDetailSectionKeys } from "@/server/application/sectionCopyUseCases";
import type { SectionCopy } from "@/server/domain/entities";
import { MediaAsset } from "./MediaAsset";

const defaultAboutCards = [
  "District-approved deployment",
  "Field-ready control boxes",
  "Up to 50% bill-reduction potential",
  "One-year service warranty"
];

type AboutDetails = Partial<Record<(typeof aboutDetailSectionKeys)[number], SectionCopy>>;

export function About({ copy, details = {}, media }: { copy?: SectionCopy; details?: AboutDetails; media: MediaMap }) {
  if (copy?.visible === false) return null;

  const missionCopy = details["home.about.mission"];
  const cardCopies = aboutDetailSectionKeys
    .filter((sectionKey) => sectionKey !== "home.about.mission")
    .map((sectionKey, index) => details[sectionKey] ?? fallbackCard(sectionKey, defaultAboutCards[index] ?? ""))
    .filter((detail) => detail.visible !== false);

  console.info("[about-section-validation]", {
    headingKey: copy?.sectionKey ?? "fallback",
    missionVisible: missionCopy?.visible !== false,
    cardCopyCount: cardCopies.length,
    configuredKeys: aboutDetailSectionKeys.length
  });

  return (
    <section id="about" className="bg-ves-deep text-ves-paper">
      <div className="section-shell grid items-center gap-12 md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-[280px] overflow-hidden rounded border border-ves-leaf/25 bg-ves-black shadow-soft md:min-h-[420px]">
          <MediaAsset media={getMedia(media, "about.image")} className="object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(8,11,10,.36))]" />
        </div>
        <div>
          <p className="eyebrow text-ves-lime">{copy?.eyebrow || "About"}</p>
          <h2 className="mt-4 text-3xl font-extrabold leading-[1.08] text-ves-paper md:text-5xl">
            {copy?.title || "Practical infrastructure technology for local governments and rural communities"}
          </h2>
          <p className="mt-6 text-base leading-8 text-ves-paper/75 md:text-lg">
            {copy?.body || "VES was founded to solve a municipal problem observed directly in the field: streetlights running around the clock, wasting electricity, burning out hardware, and creating recurring repair costs for local bodies."}
          </p>
          {missionCopy?.visible === false ? null : <p className="mt-4 text-base font-semibold leading-8 text-ves-lime md:text-lg">{missionCopy?.body || "Build simple, rugged, field-tested automation that works in real operating conditions, fits district-level budgets, and can be installed and serviced by an accountable local team."}</p>}
          {cardCopies.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {cardCopies.map((item) => (
                <div className="rounded border border-ves-leaf/25 bg-ves-black/45 px-5 py-4 text-sm font-semibold leading-6 text-ves-paper shadow-[0_12px_34px_rgba(8,11,10,0.16)] md:text-base" key={item.sectionKey}>
                  {item.title}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function fallbackCard(sectionKey: string, title: string): SectionCopy {
  return {
    id: sectionKey,
    sectionKey,
    eyebrow: "About Card",
    title,
    body: title,
    visible: true,
    theme: "dark",
    animationDirection: "right",
    animationSeconds: 46,
    maxItems: 1,
    updatedAt: new Date(0)
  };
}
