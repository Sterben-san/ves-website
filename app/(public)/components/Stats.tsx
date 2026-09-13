const stats = [
  ["Dec 2024", "Established"],
  ["Up to 50%", "Electricity-bill reduction potential"],
  ["Rs. 3,800", "Control-unit cost model"],
  ["1 year", "Service warranty"]
];

export function Stats() {
  return (
    <section className="bg-ves-black pt-6 text-ves-paper">
      <div className="section-shell grid grid-cols-2 gap-3 py-8 md:grid-cols-4 md:gap-5 md:py-10">
        {stats.map(([value, label]) => (
          <article className="rounded border border-ves-leaf/25 bg-ves-deep p-4 shadow-soft md:p-7" key={label}>
            <p className="text-xs font-semibold leading-5 text-ves-paper/62 md:text-sm">{label}</p>
            <p className="mt-2 text-2xl font-extrabold leading-[1.12] text-ves-lime md:mt-3 md:text-4xl">{value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
