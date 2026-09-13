import Link from "next/link";
import type { InternshipUpdate } from "@/server/domain/entities";

export function InternshipNoticeBar({ internships }: { internships: InternshipUpdate[] }) {
  const active = internships.slice(0, 2);

  if (active.length === 0) return null;

  return (
    <section id="internships" className="border-y border-ves-leaf/25 bg-ves-black text-ves-paper" aria-label="Active VES internship openings">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="rounded border border-ves-leaf/30 bg-ves-deep p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-ves-lime">Internships</p>
              <h2 className="mt-2 text-2xl font-extrabold leading-[1.12] text-ves-paper">Active openings</h2>
            </div>
            <Link className="focus-ring rounded bg-ves-leaf px-3 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-white" href="/internships">
              Openings
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {active.map((internship) => (
              <Link className="focus-ring rounded border border-ves-leaf/20 bg-ves-black/35 p-4 transition hover:border-ves-lime" href="/internships" key={internship.id}>
                <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-ves-lime">{internship.location || "Active"}</span>
                <span className="mt-2 block font-extrabold leading-[1.12] text-ves-paper">{internship.title}</span>
                <span className="mt-1 line-clamp-2 block text-sm font-medium leading-6 text-ves-paper/65">{internship.description}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
