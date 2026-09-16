"use client";

import { FormEvent, useState } from "react";
import type { SectionCopy } from "@/server/domain/entities";
import { adminFetch } from "../../_components/adminFetch";
import { useToast } from "../../_components/Toast";

const aboutSectionKeys = ["home.about", "home.about.mission", "home.about.card.deployment", "home.about.card.controlBoxes", "home.about.card.billReduction", "home.about.card.warranty"];
const aboutCardSectionKeys = ["home.about.card.deployment", "home.about.card.controlBoxes", "home.about.card.billReduction", "home.about.card.warranty"];

const sectionLabels: Record<string, string> = {
  "home.about.card.deployment": "District-approved deployment",
  "home.about.card.controlBoxes": "Field-ready control boxes",
  "home.about.card.billReduction": "Bill-reduction potential",
  "home.about.card.warranty": "Service warranty"
};

export type AdminAboutSectionCopy = Omit<SectionCopy, "updatedAt"> & {
  ctaLabel: string;
  ctaHref: string;
  updatedAt: string;
};

type Draft = Pick<AdminAboutSectionCopy, "eyebrow" | "title" | "body" | "ctaLabel" | "ctaHref" | "visible" | "theme" | "animationDirection" | "animationSeconds" | "maxItems">;

export function AboutDashboardClient({ initialCopies }: { initialCopies: AdminAboutSectionCopy[] }) {
  const initialDrafts = Object.fromEntries(
    initialCopies.map((copy) => [
      copy.sectionKey,
      {
        eyebrow: copy.eyebrow,
        title: copy.title,
        body: copy.body,
        ctaLabel: copy.ctaLabel ?? "",
        ctaHref: copy.ctaHref ?? "",
        visible: copy.visible,
        theme: copy.theme,
        animationDirection: copy.animationDirection,
        animationSeconds: copy.animationSeconds,
        maxItems: copy.maxItems
      } satisfies Draft
    ])
  ) as Record<string, Draft>;
  const [drafts, setDrafts] = useState(initialDrafts);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const about = drafts["home.about"];
  const mission = drafts["home.about.mission"];

  function setAboutField(sectionKey: string, key: keyof Draft, value: Draft[keyof Draft]) {
    setDrafts((current) => ({
      ...current,
      [sectionKey]: {
        ...current[sectionKey],
        [key]: value
      }
    }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const payloads = aboutSectionKeys
        .filter((sectionKey) => drafts[sectionKey])
        .map((sectionKey) => {
          const draft = drafts[sectionKey];
          const normalizedDraft = aboutCardSectionKeys.includes(sectionKey) ? { ...draft, body: draft.title } : draft;
          return adminFetch(`/api/admin/section-copy/${encodeURIComponent(sectionKey)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(normalizedDraft)
          }).then(async (response) => {
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error ?? `Unable to save ${sectionLabels[sectionKey] ?? sectionKey}.`);
            return payload.copy as AdminAboutSectionCopy;
          });
        });

      const savedCopies = await Promise.all(payloads);
      setDrafts((current) => ({
        ...current,
        ...Object.fromEntries(
          savedCopies.map((copy) => [
            copy.sectionKey,
            {
              eyebrow: copy.eyebrow,
              title: copy.title,
              body: copy.body,
              ctaLabel: copy.ctaLabel ?? "",
              ctaHref: copy.ctaHref ?? "",
              visible: copy.visible,
              theme: copy.theme,
              animationDirection: copy.animationDirection,
              animationSeconds: copy.animationSeconds,
              maxItems: copy.maxItems
            } satisfies Draft
          ])
        )
      }));
      toast({ title: "About section saved", body: "Heading, paragraph, mission line, and cards were updated.", variant: "success" });
    } catch (error) {
      toast({ title: "Save failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  if (!about || !mission) return null;

  return (
    <form className="rounded border border-ves-leaf/20 bg-white p-5 shadow-sm" onSubmit={save}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ves-leaf/15 pb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-ves-leaf">About Section</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Main about content</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            Edit the homepage About block: heading, paragraph, bold mission line, and the four small cards under it.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-black text-slate-700">
            <input checked={about.visible} type="checkbox" onChange={(event) => setAboutField("home.about", "visible", event.target.checked)} />
            Show About
          </label>
          <button className="focus-ring rounded bg-ves-ink px-4 py-2 text-sm font-black text-white disabled:opacity-50" disabled={saving}>
            {saving ? "Saving..." : "Save About Section"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Sideheading
          <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" maxLength={40} required value={about.eyebrow} onChange={(event) => setAboutField("home.about", "eyebrow", event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Heading
          <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" maxLength={120} required value={about.title} onChange={(event) => setAboutField("home.about", "title", event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-black text-slate-700 lg:col-span-2">
          Main Paragraph
          <textarea className="focus-ring min-h-24 rounded border border-slate-200 px-3 py-2 font-semibold leading-7" maxLength={260} required value={about.body} onChange={(event) => setAboutField("home.about", "body", event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-black text-slate-700 lg:col-span-2">
          Mission Line
          <textarea className="focus-ring min-h-24 rounded border border-slate-200 px-3 py-2 font-semibold leading-7" maxLength={260} required value={mission.body} onChange={(event) => setAboutField("home.about.mission", "body", event.target.value)} />
        </label>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-4">
        {aboutCardSectionKeys.map((sectionKey) => {
          const draft = drafts[sectionKey];
          if (!draft) return null;
          return (
            <label className="grid gap-2 rounded border border-slate-200 bg-slate-50 p-4 text-sm font-black text-slate-700" key={sectionKey}>
              <span>{sectionLabels[sectionKey] ?? "Card"}</span>
              <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" maxLength={120} required value={draft.title} onChange={(event) => setAboutField(sectionKey, "title", event.target.value)} />
              <span className="flex items-center gap-2 text-xs font-black text-slate-500">
                <input checked={draft.visible} type="checkbox" onChange={(event) => setAboutField(sectionKey, "visible", event.target.checked)} />
                Show card
              </span>
            </label>
          );
        })}
      </div>
    </form>
  );
}
