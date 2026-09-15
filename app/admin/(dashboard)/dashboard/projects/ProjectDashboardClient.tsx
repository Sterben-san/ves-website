"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import type { Project } from "@/server/domain/entities";
import { adminFetch } from "../../_components/adminFetch";
import { DataTable, type DataTableColumn } from "../../_components/DataTable";
import { useConfirm } from "../../_components/ConfirmDialog";
import { useToast } from "../../_components/Toast";

export type AdminProject = Omit<Project, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

type Draft = {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  location: string;
  mapUrl: string;
  category: string;
  coverUrl?: string;
  galleryImages: AdminProject["galleryImages"];
  featured: boolean;
  published: boolean;
  file?: File;
  galleryFiles?: File[];
  removeCover?: boolean;
  removeGalleryPublicIds?: string[];
};

const emptyDraft: Draft = {
  title: "",
  slug: "",
  summary: "",
  body: "",
  location: "",
  mapUrl: "",
  category: "",
  galleryImages: [],
  featured: false,
  published: false
};

export function ProjectDashboardClient({ initialProjects }: { initialProjects: AdminProject[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [dragId, setDragId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const confirm = useConfirm();
  const toast = useToast();

  const columns = useMemo<Array<DataTableColumn<AdminProject>>>(
    () => [
      {
        key: "project",
        header: "Project",
        render: (row) => (
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded bg-slate-900 text-xs font-black text-ves-lime">
              {row.coverUrl ? <Image src={row.coverUrl} alt="" fill sizes="80px" className="object-cover" /> : "Draft"}
            </div>
            <div className="min-w-0">
              <p className="break-words font-black text-slate-950">{row.title || "Draft project slot"}</p>
              <p className="break-all text-xs font-semibold text-slate-500">{row.category || row.slug}</p>
              {!isComplete(row) ? <p className="mt-1 text-xs font-black text-amber-700">Draft - not yet published</p> : null}
            </div>
          </div>
        )
      },
      {
        key: "state",
        header: "State",
        render: (row) => (
          <div className="flex flex-wrap gap-1">
            <span className={`rounded px-2 py-1 text-xs font-black ${row.published ? "bg-ves-lime text-ves-ink" : "bg-slate-100 text-slate-500"}`}>{row.published ? "Published" : "Draft"}</span>
            <span className={`rounded px-2 py-1 text-xs font-black ${row.featured ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>{row.featured ? "Featured" : "Not featured"}</span>
          </div>
        )
      },
      { key: "updated", header: "Updated", render: (row) => new Date(row.updatedAt).toLocaleDateString() }
    ],
    []
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.published && !canPublish(draft)) {
      toast({ title: "Complete the project before publishing", body: "Title, cover image, and short description are required.", variant: "error" });
      return;
    }

    setSaving(true);
    try {
      const form = new FormData();
      form.set("title", draft.title);
      form.set("slug", draft.slug || slugify(draft.title));
      form.set("summary", draft.summary);
      form.set("body", draft.body);
      form.set("location", draft.location);
      form.set("mapUrl", draft.mapUrl);
      form.set("category", draft.category);
      form.set("featured", String(draft.featured));
      form.set("published", String(draft.published || publishable));
      if (draft.file) form.set("file", draft.file);
      draft.galleryFiles?.forEach((file) => form.append("galleryFiles", file));
      if (draft.removeCover) form.set("removeCover", "true");
      if (draft.removeGalleryPublicIds?.length) form.set("removeGalleryPublicIds", JSON.stringify(draft.removeGalleryPublicIds));

      const response = await adminFetch(draft.id ? `/api/admin/projects/${draft.id}` : "/api/admin/projects", {
        method: draft.id ? "PATCH" : "POST",
        body: form
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save project.");
      const saved = serializeFromApi(payload.project);
      setProjects((current) => (draft.id ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current]));
      setDraft(emptyDraft);
      toast({ title: saved.published ? "Project published" : "Project saved as draft", variant: "success" });
    } catch (error) {
      toast({ title: "Save failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function toggle(row: AdminProject, key: "published" | "featured") {
    if (key === "published" && !row.published && !isComplete(row)) {
      toast({ title: "Cannot publish incomplete project", body: "Add title, cover image, and short description first.", variant: "error" });
      return;
    }
    setBusyId(row.id);
    try {
      const form = new FormData();
      form.set(key, String(!row[key]));
      const response = await adminFetch(`/api/admin/projects/${row.id}`, { method: "PATCH", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to update project.");
      setProjects((current) => current.map((item) => (item.id === row.id ? serializeFromApi(payload.project) : item)));
      toast({ title: "Project updated", variant: "success" });
    } catch (error) {
      toast({ title: "Update failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(row: AdminProject) {
    const ok = await confirm({ title: "Delete project?", body: "This removes it from admin and public project lists.", destructiveLabel: "Delete" });
    if (!ok) return;
    setBusyId(row.id);
    try {
      const response = await adminFetch(`/api/admin/projects/${row.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to delete project.");
      setProjects((current) => current.filter((item) => item.id !== row.id));
      toast({ title: "Project deleted", variant: "success" });
    } catch (error) {
      toast({ title: "Delete failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function reorder(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const from = projects.findIndex((project) => project.id === dragId);
    const to = projects.findIndex((project) => project.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...projects];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setProjects(next);
    try {
      const response = await adminFetch("/api/admin/projects/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((project) => project.id) })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to reorder projects.");
      setProjects(payload.projects.map(serializeFromApi));
    } catch (error) {
      toast({ title: "Reorder failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    }
  }

  function edit(row: AdminProject) {
    setDraft({
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      body: row.body,
      location: row.location ?? "",
      mapUrl: row.mapUrl ?? "",
      category: row.category ?? "",
      coverUrl: row.coverUrl,
      galleryImages: row.galleryImages,
      featured: row.featured,
      published: row.published
    });
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setDraft((current) => ({ ...current, file, removeCover: false }));
  }

  function chooseGalleryFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length) setDraft((current) => ({ ...current, galleryFiles: [...(current.galleryFiles ?? []), ...files] }));
  }

  function toggleGalleryRemoval(publicId: string, checked: boolean) {
    setDraft((current) => {
      const currentIds = current.removeGalleryPublicIds ?? [];
      return {
        ...current,
        removeGalleryPublicIds: checked ? [...new Set([...currentIds, publicId])] : currentIds.filter((id) => id !== publicId)
      };
    });
  }

  function removePendingGalleryFile(index: number) {
    setDraft((current) => ({ ...current, galleryFiles: (current.galleryFiles ?? []).filter((_, itemIndex) => itemIndex !== index) }));
  }

  const previewUrl = draft.file ? URL.createObjectURL(draft.file) : draft.coverUrl;
  const publishable = canPublish(draft);

  return (
    <div className="mt-6 grid min-w-0 gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <form className="grid min-w-0 gap-4 self-start rounded border border-slate-200 bg-white p-4 shadow-sm sm:p-5" onSubmit={save}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-black text-slate-950">{draft.id ? "Edit project" : "Add project"}</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">Publishing requires a title, cover image, and short description.</p>
          </div>
          {draft.id ? <button className="focus-ring rounded border border-slate-200 px-3 py-1.5 text-xs font-black" type="button" onClick={() => setDraft(emptyDraft)}>New</button> : null}
        </div>

        <div className="grid gap-3">
          <div className="relative aspect-[16/10] overflow-hidden rounded bg-slate-900 text-ves-lime">
            {previewUrl ? <Image src={previewUrl} alt="" fill sizes="440px" className="object-cover" unoptimized={previewUrl.startsWith("blob:")} /> : <div className="grid h-full place-items-center text-sm font-black">Draft cover slot</div>}
          </div>
          <input accept="image/jpeg,image/png,image/webp" className="text-sm font-semibold" type="file" onChange={chooseFile} />
          {draft.coverUrl || draft.file ? (
            <label className="flex items-center gap-2 text-sm font-black text-slate-700">
              <input checked={Boolean(draft.removeCover)} type="checkbox" onChange={(event) => setDraft((current) => ({ ...current, removeCover: event.target.checked, file: event.target.checked ? undefined : current.file }))} />
              Remove current cover
            </label>
          ) : null}
        </div>

        <Field label="Title" value={draft.title} onChange={(value) => setDraft((current) => ({ ...current, title: value, slug: current.slug || slugify(value) }))} />
        <Field label="Slug" value={draft.slug} onChange={(value) => setDraft((current) => ({ ...current, slug: slugify(value) }))} />
        <Field label="Category tag" value={draft.category} onChange={(value) => setDraft((current) => ({ ...current, category: value }))} />
        <Field label="Location" value={draft.location} onChange={(value) => setDraft((current) => ({ ...current, location: value }))} />
        <Field label="Public map URL" value={draft.mapUrl} onChange={(value) => setDraft((current) => ({ ...current, mapUrl: value }))} />
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Short description
          <textarea className="focus-ring min-h-24 rounded border border-slate-200 px-3 py-2 font-semibold leading-7" value={draft.summary} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} />
        </label>

        <section className="rounded border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-black text-slate-700">Project gallery images</p>
            <p className="text-xs font-semibold leading-5 text-slate-500">Upload extra field photos for the public project detail page.</p>
          </div>
          <input accept="image/jpeg,image/png,image/webp" className="mt-3 text-sm font-semibold" multiple type="file" onChange={chooseGalleryFiles} />
          {draft.galleryImages.length > 0 ? (
            <div className="mt-3 grid gap-2">
              {draft.galleryImages.map((image) => (
                <label className="flex items-center gap-3 rounded border border-slate-200 bg-white p-2 text-xs font-bold text-slate-600" key={image.publicId}>
                  <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-slate-900">
                    <Image src={image.url} alt={image.altText || "Project gallery image"} fill sizes="64px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1 break-all">{image.altText || image.publicId}</span>
                  <input checked={(draft.removeGalleryPublicIds ?? []).includes(image.publicId)} type="checkbox" onChange={(event) => toggleGalleryRemoval(image.publicId, event.target.checked)} />
                  Remove
                </label>
              ))}
            </div>
          ) : null}
          {draft.galleryFiles?.length ? (
            <div className="mt-3 grid gap-2">
              {draft.galleryFiles.map((file, index) => (
                <div className="flex items-center justify-between gap-3 rounded border border-ves-leaf/20 bg-white p-2 text-xs font-bold text-slate-600" key={`${file.name}-${index}`}>
                  <span className="min-w-0 break-all">{file.name}</span>
                  <button className="focus-ring rounded border border-slate-200 px-2 py-1 font-black" type="button" onClick={() => removePendingGalleryFile(index)}>Remove</button>
                </div>
              ))}
            </div>
          ) : null}
        </section>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Full project info
          <textarea className="focus-ring min-h-36 rounded border border-slate-200 px-3 py-2 font-semibold leading-7" value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} />
        </label>

        {!publishable ? <p className="rounded bg-amber-50 p-3 text-sm font-bold text-amber-900">Draft - not yet publishable. Add title, cover image, and short description.</p> : null}

        <label className="flex items-center gap-2 text-sm font-black text-slate-700">
          <input checked={draft.featured} disabled={!publishable} type="checkbox" onChange={(event) => setDraft((current) => ({ ...current, featured: event.target.checked }))} />
          Feature on homepage
        </label>
        <label className="flex items-center gap-2 text-sm font-black text-slate-700">
          <input checked={draft.published} disabled={!publishable} type="checkbox" onChange={(event) => setDraft((current) => ({ ...current, published: event.target.checked }))} />
          Published publicly
        </label>

        <button className="focus-ring rounded bg-ves-ink px-4 py-2 font-black text-white disabled:opacity-50" disabled={saving}>
          {saving ? "Saving..." : "Save Project"}
        </button>
      </form>

      <div className="grid min-w-0 gap-5">
        <section className="rounded border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-xl font-black text-slate-950">Display order</h2>
          <div className="mt-4 grid gap-3">
            {projects.map((project) => (
              <div
                className="cursor-move rounded border border-slate-200 p-3 text-sm font-black text-slate-700"
                draggable
                key={project.id}
                onDragEnd={() => setDragId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={() => setDragId(project.id)}
                onDrop={() => reorder(project.id)}
              >
                <span className="break-words">{project.title || "Draft project slot"}</span>
                <span className="ml-0 block break-all font-semibold text-slate-500 sm:ml-2 sm:inline">{project.category || project.slug}</span>
              </div>
            ))}
          </div>
        </section>

        <DataTable
          rows={projects}
          columns={columns}
          getRowKey={(row) => row.id}
          emptyState="No projects yet."
          actions={(row) => (
            <div className="flex flex-wrap gap-2">
              <button className="focus-ring rounded border border-slate-200 px-3 py-1.5 text-xs font-black" disabled={busyId === row.id} onClick={() => edit(row)}>Edit</button>
              <button className="focus-ring rounded border border-slate-200 px-3 py-1.5 text-xs font-black" disabled={busyId === row.id} onClick={() => toggle(row, "featured")}>{row.featured ? "Unfeature" : "Feature"}</button>
              <button className="focus-ring rounded border border-slate-200 px-3 py-1.5 text-xs font-black" disabled={busyId === row.id} onClick={() => toggle(row, "published")}>{row.published ? "Unpublish" : "Publish"}</button>
              <button className="focus-ring rounded bg-red-700 px-3 py-1.5 text-xs font-black text-white" disabled={busyId === row.id} onClick={() => remove(row)}>Delete</button>
            </div>
          )}
        />
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange(value: string): void }) {
  return (
    <label className="grid gap-1 text-sm font-black text-slate-700">
      {label}
      <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function serializeFromApi(project: Project): AdminProject {
  return {
    ...project,
    createdAt: new Date(project.createdAt).toISOString(),
    updatedAt: new Date(project.updatedAt).toISOString()
  };
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function canPublish(project: Draft) {
  return Boolean(project.title.trim() && project.summary.trim() && (project.file || (project.coverUrl && !project.removeCover)));
}

function isComplete(project: AdminProject) {
  return Boolean(project.title.trim() && project.summary.trim() && project.coverUrl);
}
