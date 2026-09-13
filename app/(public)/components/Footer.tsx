import Image from "next/image";
import { getActiveInternships, getPublishedAnnouncements, getSocialLinks } from "@/lib/content";
import { getMedia, type MediaMap } from "@/lib/media";
import { company } from "@/lib/siteContent";

export async function Footer({ media }: { media: MediaMap }) {
  const logo = getMedia(media, "footer.logo");
  const [announcements, internships, socialLinks] = await Promise.all([
    getPublishedAnnouncements(undefined, 1),
    getActiveInternships(),
    getSocialLinks()
  ]);

  return (
    <footer className="bg-ves-black text-ves-paper">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-16 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr]">
        <div>
          <div className="flex items-center gap-4">
            <div className="grid h-24 w-20 shrink-0 place-items-center overflow-hidden rounded bg-white p-2">
              {logo.mediaType === "image" ? <Image src={logo.url} alt={logo.altText} width={76} height={98} className="h-full w-full object-contain" /> : null}
            </div>
            <div>
              <p className="font-extrabold">{company.name}</p>
              <p className="mt-1 text-sm text-ves-paper/65">{company.location}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-2 text-sm font-semibold text-ves-paper/65">
            <a href={`mailto:${company.email}`}>{company.email}</a>
            <a href={`tel:${company.phone.replace(/\s+/g, "")}`}>{company.phone}</a>
            <a href={`tel:${company.alternatePhone.replace(/\s+/g, "")}`}>{company.alternatePhone}</a>
            <p>Regd No: {company.registrationNumber}</p>
            <a href={company.map} rel="noreferrer" target="_blank">Open map</a>
          </div>
        </div>
        <FooterColumn
          title="VES.01"
          links={[
            ["About", "/#about"],
            ["Work", "/#solutions"],
            ["Team", "/#team"],
            ...(internships.length > 0 ? [["Internships", "/#internships"] as [string, string]] : []),
            ["Contact", "/#contact"]
          ]}
        />
        <FooterColumn
          title="VES.02"
          links={[
            ["Streetlight Automation", "/#solutions"],
            ["Control Boxes", "/#solutions"],
            ["High Mast Lighting", "/#solutions"],
            ["Safety", "/#journey"],
            ["Field Support", "/#solutions"]
          ]}
        />
        <FooterColumn
          title="VES.03"
          links={[
            ["Instagram", company.instagram],
            ["LinkedIn", company.linkedin],
            ...(socialLinks.length > 0 ? [["Social", "/#social"] as [string, string]] : []),
            ...(announcements.total > 0 ? [["News", "/#news"] as [string, string]] : [])
          ]}
        />
      </div>
      <div className="border-t border-ves-leaf/20 px-6 py-5 text-center text-xs font-semibold text-ves-paper/45">
        Copyright 2026 VES. All rights reserved. Website by BNL/S.
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: Array<[string, string]> }) {
  return (
    <nav className="grid content-start gap-3 text-sm font-semibold text-ves-paper/68">
      <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-ves-lime">{title}</p>
      {links.map(([label, href]) => (
        <a className="focus-ring transition hover:text-ves-lime" href={href} key={`${title}-${label}`} rel={href.startsWith("http") ? "noreferrer" : undefined} target={href.startsWith("http") ? "_blank" : undefined}>
          {label}
        </a>
      ))}
    </nav>
  );
}
