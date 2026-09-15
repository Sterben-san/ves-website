import { companyStory } from "@/lib/siteContent";
import type { SectionCopy } from "@/server/domain/entities";

export function CompanyStory({ copy }: { copy?: SectionCopy }) {
  if (copy?.visible === false) return null;

  const modelHighlights = [
    ["Problem", companyStory.problem],
    ["Solution", companyStory.solution],
    ["Public Buyers", "Government bodies remain the primary customer segment, with rural and urban consumers as the secondary automation market."],
    ["Device Economics", "Each control unit is planned around a fully loaded cost of Rs. 3,800 and a one-year service warranty."]
  ];

  return (
    <section id="company-model" className="bg-ves-black text-ves-paper">
      <div className="section-shell">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="eyebrow text-ves-lime">{copy?.eyebrow || "Company Model"}</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-[1.08] text-ves-paper md:text-5xl">
              {copy?.title || "Built as a practical public-infrastructure partner"}
            </h2>
          </div>
          <p className="text-base leading-8 text-ves-paper/76 md:text-lg">
            {copy?.body || `${companyStory.theme}: automatic streetlight control, field installation, and long-term service support brought together for rural and district-level operating conditions.`}
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {modelHighlights.map(([label, copy], index) => (
            <article className="rounded border border-ves-leaf/30 bg-ves-deep p-5 shadow-soft md:p-6" key={label}>
              <p className="text-sm font-extrabold text-ves-lime">{String(index + 1).padStart(2, "0")}</p>
              <h3 className="mt-4 text-xl font-extrabold leading-[1.15] text-ves-paper">{label}</h3>
              <p className="mt-3 line-clamp-4 text-sm font-medium leading-6 text-ves-paper/68 md:line-clamp-none">{copy}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {companyStory.impact.map(([label, copy]) => (
            <article className="rounded border border-ves-lime/25 bg-ves-lime p-5 text-ves-black shadow-soft" key={label}>
              <h3 className="text-lg font-extrabold leading-[1.12]">{label} Impact</h3>
              <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-ves-black/72 md:line-clamp-none">{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
