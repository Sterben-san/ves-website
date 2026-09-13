"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { AnnouncementHero } from "@/app/(public)/components/AnnouncementHero";
import type { Announcement, AnnouncementKind } from "@/server/domain/entities";
import { adminFetch } from "../../_components/adminFetch";
import { useToast } from "../../_components/Toast";
import type { AdminAnnouncement } from "./AnnouncementDashboardClient";

type Draft = {
  title: string;
  kind: AnnouncementKind;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  backgroundType: "none" | "image" | "video";
  overlayOpacity: number;
  textPosition: "left" | "center" | "right";
  pinned: boolean;
  published: boolean;
};

type Files = {
  backgroundFile?: File;
  posterFile?: File;
  mobileFallbackFile?: File;
};

const defaultDraft: Draft = {
  title: "",
  kind: "update",
  body: "",
  ctaLabel: "",
  ctaHref: "",
  backgroundType: "none",
  overlayOpacity: 0.5,
  textPosition: "left",
  pinned: false,
  published: false
};

export function AnnouncementEditorClient({ mode, initialAnnouncement }: { mode: "create" | "edit"; initialAnnouncement?: AdminAnnouncement }) {
  const [draft, setDraft] = useState<Draft>(() => ({
    ...defaultDraft,
    ...initialAnnouncement,
    ctaLabel: initialAnnouncement?.ctaLabel ?? "",
    ctaHref: initialAnnouncement?.ctaHref ?? ""
  }));
  const [files, setFiles] = useState<Files>({});
  const [urls, setUrls] = useState<{ background?: string; poster?: string; mobile?: string }>({});
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    const created = Object.values(urls).filter(Boolean) as string[];
    return () => created.forEach((url) => URL.revokeObjectURL(url));
  }, [urls]);

  const warnings = useMemo(() => {
    const items: string[] = [];
    if (!draft.body.trim()) items.push("Body copy is required before saving.");
    if (draft.overlayOpacity < 0.35 && draft.backgroundType !== "none") items.push("Overlay is low; verify headline contrast in the preview.");
    if (draft.backgroundType === "video" && !files.mobileFallbackFile && !initialAnnouncement?.mobileFallbackUrl) items.push("Add a mobile fallback image for stronger reduced-motion support.");
    if (draft.backgroundType === "video" && !files.posterFile && !initialAnnouncement?.posterUrl && !files.backgroundFile) items.push("Upload a poster image or a new video.");
    return items;
  }, [draft, files, initialAnnouncement]);

  const previewAnnouncement = useMemo<Announcement>(
    () => ({
      id: initialAnnouncement?.id ?? "preview",
      slug: initialAnnouncement?.slug ?? "preview",
      authorId: initialAnnouncement?.authorId ?? "preview",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...draft,
      ctaLabel: draft.ctaLabel || undefined,
      ctaHref: draft.ctaHref || undefined,
      backgroundUrl: urls.background ?? initialAnnouncement?.backgroundUrl,
      backgroundPublicId: initialAnnouncement?.backgroundPublicId,
      posterUrl: urls.poster ?? initialAnnouncement?.posterUrl,
      posterPublicId: initialAnnouncement?.posterPublicId,
      mobileFallbackUrl: urls.mobile ?? initialAnnouncement?.mobileFallbackUrl,
      mobileFallbackPublicId: initialAnnouncement?.mobileFallbackPublicId
    }),
    [draft, initialAnnouncement, urls]
  );

  function setField<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function setFile(key: keyof Files, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setFiles((current) => ({ ...current, [key]: file }));
    setUrls((current) => {
      const urlKey = key === "backgroundFile" ? "background" : key === "posterFile" ? "poster" : "mobile";
      if (current[urlKey]) URL.revokeObjectURL(current[urlKey]);
      return { ...current, [urlKey]: objectUrl };
    });
    if (key === "backgroundFile") {
      setField("backgroundType", file.type.startsWith("video/") ? "video" : "image");
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData();
    form.set("title", draft.title);
    form.set("kind", draft.kind);
    form.set("body", draft.body);
    form.set("backgroundType", draft.backgroundType);
    form.set("overlayOpacity", String(draft.overlayOpacity));
    form.set("textPosition", draft.textPosition);
    form.set("published", String(draft.published));
    form.set("pinned", String(draft.pinned));
    if (draft.ctaLabel) form.set("ctaLabel", draft.ctaLabel);
    if (draft.ctaHref) form.set("ctaHref", draft.ctaHref);
    if (files.backgroundFile) form.set("backgroundFile", files.backgroundFile);
    if (files.posterFile) form.set("posterFile", files.posterFile);
    if (files.mobileFallbackFile) form.set("mobileFallbackFile", files.mobileFallbackFile);

    try {
      const response = await adminFetch(mode === "create" ? "/api/admin/announcements" : `/api/admin/announcements/${initialAnnouncement?.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        body: form
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save announcement.");
      toast({ title: "Announcement saved", variant: "success" });
      router.push("/admin/dashboard/announcements");
      router.refresh();
    } catch (error) {
      toast({ title: "Save failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-ves-leaf">Announcements</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{mode === "create" ? "New announcement" : "Edit announcement"}</h1>
        </div>
        <Link className="focus-ring rounded border border-slate-200 px-4 py-2 text-sm font-black" href="/admin/dashboard/announcements">
          Back
        </Link>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
        <form className="grid gap-4 rounded border border-slate-200 bg-white p-5 shadow-sm" onSubmit={save}>
          <label className="grid gap-1 text-sm font-black text-slate-700">
            Title
            <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" required value={draft.title} onChange={(event) => setField("title", event.target.value)} />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-black text-slate-700">
              Kind
              <select className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" value={draft.kind} onChange={(event) => setField("kind", event.target.value as AnnouncementKind)}>
                <option value="update">Update</option>
                <option value="article">Article</option>
                <option value="video">Video</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-black text-slate-700">
              Text Position
              <select className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" value={draft.textPosition} onChange={(event) => setField("textPosition", event.target.value as Draft["textPosition"])}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
          </div>

          <label className="grid gap-1 text-sm font-black text-slate-700">
            Body
            <textarea className="focus-ring min-h-40 rounded border border-slate-200 px-3 py-2 font-semibold leading-7" required value={draft.body} onChange={(event) => setField("body", event.target.value)} />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-black text-slate-700">
              CTA Label
              <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" value={draft.ctaLabel} onChange={(event) => setField("ctaLabel", event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm font-black text-slate-700">
              CTA URL
              <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" value={draft.ctaHref} onChange={(event) => setField("ctaHref", event.target.value)} />
            </label>
          </div>

          <div className="rounded border border-slate-200 p-4">
            <p className="text-sm font-black text-slate-700">Media</p>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-1 text-sm font-black text-slate-700">
                Background image or video
                <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" accept="image/*,video/mp4,video/webm" type="file" onChange={(event) => setFile("backgroundFile", event)} />
              </label>
              <label className="grid gap-1 text-sm font-black text-slate-700">
                Poster image
                <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" accept="image/*" type="file" onChange={(event) => setFile("posterFile", event)} />
              </label>
              <label className="grid gap-1 text-sm font-black text-slate-700">
                Mobile fallback image
                <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" accept="image/*" type="file" onChange={(event) => setFile("mobileFallbackFile", event)} />
              </label>
            </div>
          </div>

          <label className="grid gap-2 text-sm font-black text-slate-700">
            Overlay Opacity
            <input min="0" max="0.85" step="0.05" type="range" value={draft.overlayOpacity} onChange={(event) => setField("overlayOpacity", Number(event.target.value))} />
            <span className="text-xs text-slate-500">{Math.round(draft.overlayOpacity * 100)}%</span>
          </label>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm font-black text-slate-700">
              <input checked={draft.published} type="checkbox" onChange={(event) => setField("published", event.target.checked)} />
              Published
            </label>
            <label className="flex items-center gap-2 text-sm font-black text-slate-700">
              <input checked={draft.pinned} type="checkbox" onChange={(event) => setField("pinned", event.target.checked)} />
              Pin as homepage hero
            </label>
          </div>

          {warnings.length > 0 ? (
            <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950">
              {warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}

          <button className="focus-ring rounded bg-ves-ink px-4 py-3 font-black text-white disabled:opacity-50" disabled={saving}>
            {saving ? "Saving..." : "Save Announcement"}
          </button>
        </form>

        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-black text-slate-700">Live preview</p>
            <div className="flex rounded border border-slate-200 bg-white p-1">
              {(["desktop", "mobile"] as const).map((item) => (
                <button className={`rounded px-3 py-1 text-xs font-black ${device === item ? "bg-ves-ink text-white" : "text-slate-600"}`} key={item} type="button" onClick={() => setDevice(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className={`overflow-hidden rounded border border-slate-200 bg-white ${device === "mobile" ? "mx-auto max-w-[390px]" : ""}`}>
            <AnnouncementHero announcement={previewAnnouncement} />
          </div>
        </div>
      </div>
    </div>
  );
}
