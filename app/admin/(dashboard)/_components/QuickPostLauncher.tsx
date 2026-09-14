"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SocialEmbed } from "../../../(public)/components/SocialEmbed";
import type { Announcement, AnnouncementKind, SocialPlatform } from "@/server/domain/entities";
import { adminFetch } from "./adminFetch";
import { useToast } from "./Toast";

type Mode = "internship" | "social" | "announcement";
type FieldErrors = Record<string, string>;

const choices: Array<{ mode: Mode; title: string; body: string; liveHref: string }> = [
  { mode: "internship", title: "Internship update", body: "Post an active opening with an optional attachment.", liveHref: "/internships" },
  { mode: "social", title: "Social link", body: "Embed an Instagram or LinkedIn post already published.", liveHref: "/social" },
  { mode: "announcement", title: "Announcement", body: "Publish a news update, article, or video post.", liveHref: "/news" }
];

export function QuickPostLauncher() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.closest("input, textarea, select, [contenteditable='true']");
      const opensCommand = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const opensNew = !event.metaKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === "n";
      if (isTyping || (!opensCommand && !opensNew)) return;
      event.preventDefault();
      setOpen(true);
      setMode(null);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function close() {
    setOpen(false);
    setMode(null);
  }

  return (
    <>
      <button className="focus-ring rounded bg-ves-ink px-3 py-2 text-sm font-black text-white sm:px-4" type="button" onClick={() => setOpen(true)}>
        + New
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/55 px-3 py-4 sm:px-4 sm:py-8" role="dialog" aria-modal="true" aria-label="Create a new post">
          <div className="mx-auto w-full max-w-3xl rounded border border-slate-200 bg-white shadow-2xl">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-ves-leaf">Quick Post</p>
                <h2 className="mt-1 text-xl font-black leading-tight text-slate-950 sm:text-2xl">{mode ? choices.find((choice) => choice.mode === mode)?.title : "What are you posting?"}</h2>
              </div>
              <button className="focus-ring rounded border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 sm:self-start" type="button" onClick={close}>
                Close
              </button>
            </div>

            <div className="p-4 sm:p-5">
              {!mode ? (
                <div className="grid gap-3 md:grid-cols-3">
                  {choices.map((choice) => (
                    <button
                      className="focus-ring rounded border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-ves-leaf hover:bg-white"
                      key={choice.mode}
                      type="button"
                      onClick={() => setMode(choice.mode)}
                    >
                      <span className="block text-lg font-black text-slate-950">{choice.title}</span>
                      <span className="mt-2 block text-sm font-semibold leading-6 text-slate-500">{choice.body}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {mode === "internship" ? <InternshipQuickForm onBack={() => setMode(null)} onDone={close} /> : null}
              {mode === "social" ? <SocialQuickForm onBack={() => setMode(null)} onDone={close} /> : null}
              {mode === "announcement" ? <AnnouncementQuickForm onBack={() => setMode(null)} onDone={close} /> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function InternshipQuickForm({ onBack, onDone }: { onBack(): void; onDone(): void }) {
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const toast = useToast();
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    form.set("active", String(active));
    const nextErrors: FieldErrors = {};
    if (!String(form.get("title") ?? "").trim()) nextErrors.title = "Title is required.";
    if (!String(form.get("description") ?? "").trim()) nextErrors.description = "Description is required.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      const response = await adminFetch("/api/admin/internships", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to post internship.");
      toast({ title: active ? "Internship published" : "Internship saved as a draft", variant: "success" });
      router.refresh();
      onDone();
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Unable to post internship." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <FormError message={errors.form} />
      <label className="grid gap-1 text-sm font-black text-slate-700">
        Title
        <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" name="title" required />
        <FieldError message={errors.title} />
      </label>
      <label className="grid gap-1 text-sm font-black text-slate-700">
        Description
        <textarea className="focus-ring min-h-32 rounded border border-slate-200 px-3 py-2 font-semibold leading-7" name="description" required />
        <FieldError message={errors.description} />
      </label>
      <label className="grid gap-1 text-sm font-black text-slate-700">
        Google Form URL
        <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" name="applyUrl" placeholder="https://forms.gle/..." type="url" />
      </label>
      <label className="grid gap-1 text-sm font-black text-slate-700">
        Attachment
        <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" name="file" accept="image/*,application/pdf" type="file" />
      </label>
      <label className="flex items-center gap-2 text-sm font-black text-slate-700">
        <input checked={active} type="checkbox" onChange={(event) => setActive(event.target.checked)} />
        Publish on public site
      </label>
      <FormActions label="Post Internship" saving={saving} onBack={onBack} />
    </form>
  );
}

function SocialQuickForm({ onBack, onDone }: { onBack(): void; onDone(): void }) {
  const [postUrl, setPostUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [featured, setFeatured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const detected = useMemo(() => detectSocial(postUrl), [postUrl]);
  const toast = useToast();
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detected) {
      setErrors({ postUrl: "Paste a public Instagram or LinkedIn post URL." });
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      const response = await adminFetch("/api/admin/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postUrl, caption, featured })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save social link.");
      toast({ title: "Social link added", variant: "success", actionHref: "/social", actionLabel: "View live" });
      router.refresh();
      onDone();
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Unable to save social link." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <FormError message={errors.form} />
      <label className="grid gap-1 text-sm font-black text-slate-700">
        Public URL
        <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" required type="url" value={postUrl} onChange={(event) => setPostUrl(event.target.value)} />
        <span className={`text-xs font-black ${detected ? "text-emerald-700" : "text-slate-500"}`}>
          {detected ? `${detected} post detected` : "Instagram /p or /reel and LinkedIn post/update URLs are accepted."}
        </span>
        <FieldError message={errors.postUrl} />
      </label>
      <label className="grid gap-1 text-sm font-black text-slate-700">
        Caption
        <textarea className="focus-ring min-h-24 rounded border border-slate-200 px-3 py-2 font-semibold leading-7" value={caption} onChange={(event) => setCaption(event.target.value)} />
      </label>
      <label className="flex items-center gap-2 text-sm font-black text-slate-700">
        <input checked={featured} type="checkbox" onChange={(event) => setFeatured(event.target.checked)} />
        Feature on homepage
      </label>
      {detected ? (
        <div>
          <p className="mb-2 text-sm font-black text-slate-700">Live preview</p>
          <SocialEmbed caption={caption} platform={detected} postUrl={postUrl} />
        </div>
      ) : null}
      <FormActions disabled={!detected} label="Save Social Link" saving={saving} onBack={onBack} />
    </form>
  );
}

function AnnouncementQuickForm({ onBack, onDone }: { onBack(): void; onDone(): void }) {
  const [kind, setKind] = useState<AnnouncementKind>("update");
  const [pinned, setPinned] = useState(false);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [pinnedAnnouncement, setPinnedAnnouncement] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const pinnedWarningRef = useRef<HTMLDivElement | null>(null);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/announcements/pinned")
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => setPinnedAnnouncement(body?.announcement ?? null))
      .catch(() => setPinnedAnnouncement(null));
  }, []);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setBackgroundFile(file);
    if (file?.type.startsWith("video/")) setKind("video");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const source = new FormData(formElement);
    const nextErrors: FieldErrors = {};
    if (!String(source.get("title") ?? "").trim()) nextErrors.title = "Title is required.";
    if (!String(source.get("body") ?? "").trim()) nextErrors.body = "Body is required.";
    if (pinned && pinnedAnnouncement) {
      const confirmed = window.confirm(`This will replace "${pinnedAnnouncement.title}" on the homepage. Continue?`);
      if (!confirmed) {
        pinnedWarningRef.current?.focus();
        return;
      }
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const form = new FormData();
    form.set("title", String(source.get("title") ?? ""));
    form.set("kind", kind);
    form.set("body", String(source.get("body") ?? ""));
    form.set("published", "true");
    form.set("pinned", String(pinned));
    form.set("backgroundType", backgroundFile ? (backgroundFile.type.startsWith("video/") ? "video" : "image") : "none");
    form.set("overlayOpacity", "0.5");
    form.set("textPosition", "left");
    if (backgroundFile) form.set("backgroundFile", backgroundFile);

    setSaving(true);
    setErrors({});
    try {
      const response = await adminFetch("/api/admin/announcements", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to post announcement.");
      const href = payload.announcement?.slug ? `/news/${payload.announcement.slug}` : "/news";
      toast({ title: "Announcement posted", variant: "success", actionHref: href, actionLabel: "View live" });
      router.refresh();
      onDone();
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Unable to post announcement." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <FormError message={errors.form} />
      <label className="grid gap-1 text-sm font-black text-slate-700">
        Title
        <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" name="title" required />
        <FieldError message={errors.title} />
      </label>
      <label className="grid gap-1 text-sm font-black text-slate-700">
        Kind
        <select className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" value={kind} onChange={(event) => setKind(event.target.value as AnnouncementKind)}>
          <option value="update">Update</option>
          <option value="article">Article</option>
          <option value="video">Video</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-black text-slate-700">
        Body
        <textarea className="focus-ring min-h-32 rounded border border-slate-200 px-3 py-2 font-semibold leading-7" name="body" required />
        <FieldError message={errors.body} />
      </label>
      <label className="grid gap-1 text-sm font-black text-slate-700">
        Media
        <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" accept="image/*,video/mp4,video/webm" type="file" onChange={onFileChange} />
      </label>
      <label className="flex items-center gap-2 text-sm font-black text-slate-700">
        <input checked={pinned} type="checkbox" onChange={(event) => setPinned(event.target.checked)} />
        Pin to homepage
      </label>
      {pinned && pinnedAnnouncement ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-950" ref={pinnedWarningRef} tabIndex={-1}>
          This will replace &quot;{pinnedAnnouncement.title}&quot; on the homepage.
        </div>
      ) : null}
      <FormActions label="Post Announcement" saving={saving} onBack={onBack} />
    </form>
  );
}

function FormActions({ disabled, label, saving, onBack }: { disabled?: boolean; label: string; saving: boolean; onBack(): void }) {
  return (
    <div className="grid gap-2 border-t border-slate-200 pt-4 sm:flex sm:flex-wrap">
      <button className="focus-ring rounded bg-ves-ink px-4 py-2 font-black text-white disabled:opacity-50" disabled={disabled || saving}>
        {saving ? "Posting..." : label}
      </button>
      <button className="focus-ring rounded border border-slate-200 px-4 py-2 font-black text-slate-700" type="button" onClick={onBack}>
        Back
      </button>
    </div>
  );
}

function FormError({ message }: { message?: string }) {
  return message ? (
    <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" aria-live="polite">
      {message}
    </p>
  ) : null;
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="text-xs font-bold text-red-700">{message}</span> : null;
}

function detectSocial(value: string): SocialPlatform | null {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "");
    if (host === "instagram.com" && (/^\/p\/[^/]+/.test(url.pathname) || /^\/reel\/[^/]+/.test(url.pathname))) return "instagram";
    if ((host === "linkedin.com" || host.endsWith(".linkedin.com")) && (/^\/posts\//.test(url.pathname) || /^\/feed\/update\//.test(url.pathname))) return "linkedin";
  } catch {
    return null;
  }
  return null;
}
