import { company } from "@/lib/siteContent";

export function CTA() {
  return (
    <section id="contact" className="bg-ves-field">
      <div className="section-shell">
        <div className="grid items-center gap-8 rounded border border-ves-leaf/20 bg-ves-cream p-8 shadow-soft md:grid-cols-[1.1fr_0.9fr] md:p-12">
          <div>
            <p className="eyebrow">Contact</p>
            <h2 className="mt-4 text-3xl font-extrabold leading-[1.08] text-ves-text md:text-5xl">Evaluate streetlight automation with Vishwakarma</h2>
            <p className="mt-4 text-base leading-8 text-ves-text/68">
              Tell us about your streetlight cluster, village, road, sand reach, or public-lighting challenge and we will help evaluate control-box fit, deployment scope, and service support.
            </p>
          </div>
          <div className="grid gap-3 md:text-right">
            <a className="ves-button focus-ring bg-ves-leaf text-white hover:bg-ves-ink" href={`mailto:${company.email}`}>
              Contact VES
            </a>
            <a className="focus-ring font-extrabold text-ves-leaf" href={`tel:${company.phone.replace(/\s+/g, "")}`}>
              {company.phone}
            </a>
            <a className="focus-ring font-extrabold text-ves-leaf" href={`tel:${company.alternatePhone.replace(/\s+/g, "")}`}>
              {company.alternatePhone}
            </a>
            <p className="text-sm font-semibold text-ves-text/58">Regd No: {company.registrationNumber}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
