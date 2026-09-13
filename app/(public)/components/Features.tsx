const features = [
  ["01", "Intelligent Automation", "High-sensitivity light sensors enable seamless dusk-to-dawn operation."],
  ["02", "Power Efficiency", "Optimized high-power loads reduce unnecessary consumption and energy loss."],
  ["03", "Safety First", "Centralized control reduces risky manual intervention and high-altitude maintenance for linemen."],
  ["04", "Field Support", "Site assessment, commissioning checks, maintenance planning, and practical handover support."]
];

export function Features() {
  return (
    <section id="features" className="bg-ves-mist">
      <div className="section-shell grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow">Features</p>
          <h2 className="mt-4 text-3xl font-extrabold leading-[1.08] text-ves-text md:text-5xl">Built for public-lighting reliability.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map(([number, title, copy]) => (
            <div className="rounded border border-ves-leaf/20 bg-ves-cream p-7 shadow-soft" key={title}>
              <p className="text-sm font-extrabold text-ves-lime">{number}</p>
              <h3 className="mt-4 text-xl font-extrabold leading-[1.15] text-ves-text">{title}</h3>
              <p className="mt-3 text-base leading-7 text-ves-text/70">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
