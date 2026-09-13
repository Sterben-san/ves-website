"use client";

import { FormEvent, useState } from "react";
import { adminFetch } from "../../_components/adminFetch";
import { useToast } from "../../_components/Toast";

export type AdminSectionCopy = {
  id: string;
  sectionKey: string;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  visible: boolean;
  theme: "dark" | "light" | "green";
  animationDirection: "left" | "right";
  animationSeconds: number;
  maxItems: number;
  updatedAt: string;
};

type Draft = Pick<
  AdminSectionCopy,
  "eyebrow" | "title" | "body" | "ctaLabel" | "ctaHref" | "visible" | "theme" | "animationDirection" | "animationSeconds" | "maxItems"
>;

export function NewsSectionCopyEditor({ initialCopy }: { initialCopy: AdminSectionCopy }) {
  const [draft, setDraft] = useState<Draft>({
    eyebrow: initialCopy.eyebrow,
    title: initialCopy.title,
    body: initialCopy.body,
    ctaLabel: initialCopy.ctaLabel ?? "",
    ctaHref: initialCopy.ctaHref ?? "",
    visible: initialCopy.visible,
    theme: initialCopy.theme,
    animationDirection: initialCopy.animationDirection,
    animationSeconds: initialCopy.animationSeconds,
    maxItems: initialCopy.maxItems
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  function setField<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await adminFetch(`/api/admin/section-copy/${encodeURIComponent(initialCopy.sectionKey)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save section copy.");
      setDraft({
        eyebrow: payload.copy.eyebrow,
        title: payload.copy.title,
        body: payload.copy.body,
        ctaLabel: payload.copy.ctaLabel ?? "",
        ctaHref: payload.copy.ctaHref ?? "",
        visible: payload.copy.visible,
        theme: payload.copy.theme,
        animationDirection: payload.copy.animationDirection,
        animationSeconds: payload.copy.animationSeconds,
        maxItems: payload.copy.maxItems
      });
      toast({ title: "Homepage News copy updated", variant: "success" });
    } catch (error) {
      toast({ title: "Save failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="mt-6 rounded border border-slate-200 bg-white p-5 shadow-sm" onSubmit={save}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-ves-leaf">Homepage News Section</p>
          <h2 className="mt-2 text-xl font-black text-slate-950">Customize homepage News</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            This controls the homepage News section layout, motion, and text. The cards below control the carousel content.
          </p>
        </div>
        <button className="focus-ring rounded bg-ves-ink px-4 py-2 text-sm font-black text-white disabled:opacity-50" disabled={saving}>
          {saving ? "Saving..." : "Save Copy"}
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Eyebrow
          <input
            className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold"
            maxLength={40}
            required
            value={draft.eyebrow}
            onChange={(event) => setField("eyebrow", event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Heading
          <input
            className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold"
            maxLength={120}
            required
            value={draft.title}
            onChange={(event) => setField("title", event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm font-black text-slate-700 lg:col-span-2">
          Intro Copy
          <textarea
            className="focus-ring min-h-24 rounded border border-slate-200 px-3 py-2 font-semibold leading-7"
            maxLength={260}
            required
            value={draft.body}
            onChange={(event) => setField("body", event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Button Label
          <input
            className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold"
            maxLength={40}
            value={draft.ctaLabel}
            onChange={(event) => setField("ctaLabel", event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Button URL
          <input
            className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold"
            maxLength={200}
            value={draft.ctaHref}
            onChange={(event) => setField("ctaHref", event.target.value)}
          />
        </label>
        <div className="grid gap-4 rounded border border-slate-200 bg-slate-50 p-4 lg:col-span-2 lg:grid-cols-5">
          <label className="flex items-center gap-2 text-sm font-black text-slate-700">
            <input checked={draft.visible} type="checkbox" onChange={(event) => setField("visible", event.target.checked)} />
            Visible
          </label>
          <label className="grid gap-1 text-sm font-black text-slate-700">
            Theme
            <select
              className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold"
              value={draft.theme}
              onChange={(event) => setField("theme", event.target.value as Draft["theme"])}
            >
              <option value="dark">Black</option>
              <option value="green">Green</option>
              <option value="light">Light</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-black text-slate-700">
            Direction
            <select
              className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold"
              value={draft.animationDirection}
              onChange={(event) => setField("animationDirection", event.target.value as Draft["animationDirection"])}
            >
              <option value="right">Left to right</option>
              <option value="left">Right to left</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-black text-slate-700">
            Speed Seconds
            <input
              className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold"
              max={120}
              min={18}
              type="number"
              value={draft.animationSeconds}
              onChange={(event) => setField("animationSeconds", Number(event.target.value))}
            />
          </label>
          <label className="grid gap-1 text-sm font-black text-slate-700">
            Max Cards
            <input
              className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold"
              max={16}
              min={1}
              type="number"
              value={draft.maxItems}
              onChange={(event) => setField("maxItems", Number(event.target.value))}
            />
          </label>
        </div>
      </div>
    </form>
  );
}
