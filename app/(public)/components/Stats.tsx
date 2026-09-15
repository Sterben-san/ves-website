import type { SectionCopy } from "@/server/domain/entities";

export function Stats({ stats }: { stats: SectionCopy[] }) {
  const visibleStats = stats.filter((stat) => stat.visible);

  if (visibleStats.length === 0) return null;

  return (
    <section className="bg-ves-black pt-6 text-ves-paper">
      <div className="section-shell grid grid-cols-2 gap-3 py-8 md:grid-cols-4 md:gap-5 md:py-10">
        {visibleStats.map((stat) => (
          <article className="rounded border border-ves-leaf/25 bg-ves-deep p-4 shadow-soft md:p-7" key={stat.sectionKey}>
            <p className="text-xs font-semibold leading-5 text-ves-paper/62 md:text-sm">{stat.body}</p>
            <p className="mt-2 text-2xl font-extrabold leading-[1.12] text-ves-lime md:mt-3 md:text-4xl">{stat.title}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
