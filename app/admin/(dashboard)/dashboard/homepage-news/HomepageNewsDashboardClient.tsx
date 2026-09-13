"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import type { HomepageNewsItem } from "@/server/domain/entities";
import { adminFetch } from "../../_components/adminFetch";
import { useConfirm } from "../../_components/ConfirmDialog";
import { DataTable, type DataTableColumn } from "../../_components/DataTable";
import { useToast } from "../../_components/Toast";

export type AdminHomepageNewsItem = Omit<HomepageNewsItem, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

type Draft = {
  id?: string;
  kind: HomepageNewsItem["kind"];
  title: string;
  summary: string;
  body: string;
  linkLabel: string;
  linkHref: string;
  published: boolean;
  removeImage: boolean;
  file?: File;
};

const emptyDraft: Draft = {
  kind: "milestone",
  title: "",
  summary: "",
  body: "",
  linkLabel: "",
  linkHref: "",
  published: true,
  removeImage: false
};

export function HomepageNewsDashboardClient({ initialItems }: { initialItems: AdminHomepageNewsItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const confirm = useConfirm();
  const toast = useToast();

  const editingItem = draft.id ? items.find((item) => item.id === draft.id) : undefined;

  const columns = useMemo<Array<DataTableColumn<AdminHomepageNewsItem>>>(
    () => [
      {
        key: "item",
        header: "Homepage card",
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded bg-slate-100">
              {row.imageUrl ? <Image src={row.imageUrl} alt="" fill className="object-cover" sizes="80px" /> : <div className="grid h-full place-items-center text-xs font-black uppercase text-slate-400">{row.kind}</div>}
            </div>
            <div>
              <p className="font-black text-slate-950">{row.title}</p>
              <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">{row.summary}</p>
            </div>
          </div>
        )
      },
      {
        key: "kind",
        header: "Kind",
        render: (row) => <span className="rounded bg-slate-100 px-2 py-1 text-xs font-black uppercase text-slate-600">{row.kind}</span>
      },
      {
        key: "status",
        header: "Status",
        render: (row) => <span className={`rounded px-2 py-1 text-xs font-black ${row.published ? "bg-ves-lime text-ves-ink" : "bg-slate-100 text-slate-500"}`}>{row.published ? "Visible" : "Hidden"}</span>
      },
      { key: "updated", header: "Updated", render: (row) => new Date(row.updatedAt).toLocaleDateString() }
    ],
    []
  );

  function edit(row: AdminHomepageNewsItem) {
    setDraft({
      id: row.id,
      kind: row.kind,
      title: row.title,
      summary: row.summary,
      body: row.body ?? "",
      linkLabel: row.linkLabel ?? "",
      linkHref: row.linkHref ?? "",
      published: row.published,
      removeImage: false
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const form = new FormData();
    form.set("kind", draft.kind);
    form.set("title", draft.title);
    form.set("summary", draft.summary);
    form.set("body", draft.body);
    form.set("linkLabel", draft.linkLabel);
    form.set("linkHref", draft.linkHref);
    form.set("published", String(draft.published));
    form.set("removeImage", String(draft.removeImage));
    if (draft.file) form.set("file", draft.file);

    try {
      const response = await adminFetch(draft.id ? `/api/admin/homepage-news/${draft.id}` : "/api/admin/homepage-news", {
        method: draft.id ? "PATCH" : "POST",
        body: form
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save homepage news.");
      const saved = serializeFromApi(payload.item);
      setItems((current) => (draft.id ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current]));
      setDraft(emptyDraft);
      toast({ title: "Homepage news item saved", variant: "success" });
    } catch (error) {
      toast({ title: "Save failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function toggle(row: AdminHomepageNewsItem) {
    setBusyId(row.id);
    const form = new FormData();
    form.set("published", String(!row.published));
    try {
      const response = await adminFetch(`/api/admin/homepage-news/${row.id}`, { method: "PATCH", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to update homepage news.");
      setItems((current) => current.map((item) => (item.id === row.id ? serializeFromApi(payload.item) : item)));
      toast({ title: row.published ? "Homepage news hidden" : "Homepage news published", variant: "success" });
    } catch (error) {
      toast({ title: "Update failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(row: AdminHomepageNewsItem) {
    const ok = await confirm({ title: "Delete homepage news item?", body: `This removes "${row.title}" from the homepage carousel.`, destructiveLabel: "Delete" });
    if (!ok) return;
    setBusyId(row.id);
    try {
      const response = await adminFetch(`/api/admin/homepage-news/${row.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to delete homepage news.");
      setItems((current) => current.filter((item) => item.id !== row.id));
      toast({ title: "Homepage news item deleted", variant: "success" });
    } catch (error) {
      toast({ title: "Delete failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <form className="grid gap-4 self-start rounded border border-slate-200 bg-white p-5 shadow-sm" onSubmit={save}>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-ves-leaf">News Cards</p>
          <h2 className="mt-2 text-xl font-black text-slate-950">{draft.id ? "Edit homepage card" : "New homepage card"}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">These cards only feed the homepage News carousel.</p>
        </div>

        <label className="grid gap-1 text-sm font-black text-slate-700">
          Type
          <select className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" value={draft.kind} onChange={(event) => setDraft((current) => ({ ...current, kind: event.target.value as HomepageNewsItem["kind"] }))}>
            <option value="milestone">Milestone</option>
            <option value="photo">Photo</option>
            <option value="article">Article</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Title
          <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" maxLength={120} required value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
        </label>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Short Card Text
          <textarea className="focus-ring min-h-24 rounded border border-slate-200 px-3 py-2 font-semibold leading-7" maxLength={260} required value={draft.summary} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} />
        </label>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Extra Notes
          <textarea className="focus-ring min-h-24 rounded border border-slate-200 px-3 py-2 font-semibold leading-7" maxLength={800} value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} />
        </label>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Image
          <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" accept="image/png,image/jpeg,image/webp" type="file" onChange={(event) => setDraft((current) => ({ ...current, file: event.target.files?.[0], removeImage: false }))} />
          {editingItem?.imageUrl ? <span className="text-xs font-semibold text-slate-500">Leave empty to keep the current image.</span> : null}
        </label>
        {editingItem?.imageUrl ? (
          <label className="flex items-center gap-2 text-sm font-black text-slate-700">
            <input checked={draft.removeImage} type="checkbox" onChange={(event) => setDraft((current) => ({ ...current, removeImage: event.target.checked, file: undefined }))} />
            Remove current image
          </label>
        ) : null}
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Link Label
          <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" maxLength={40} value={draft.linkLabel} onChange={(event) => setDraft((current) => ({ ...current, linkLabel: event.target.value }))} />
        </label>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Link URL
          <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" placeholder="/news or https://..." value={draft.linkHref} onChange={(event) => setDraft((current) => ({ ...current, linkHref: event.target.value }))} />
        </label>
        <label className="flex items-center gap-2 text-sm font-black text-slate-700">
          <input checked={draft.published} type="checkbox" onChange={(event) => setDraft((current) => ({ ...current, published: event.target.checked }))} />
          Visible on homepage
        </label>
        <div className="flex gap-2">
          <button className="focus-ring rounded bg-ves-ink px-4 py-2 font-black text-white disabled:opacity-50" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          {draft.id ? (
            <button className="focus-ring rounded border border-slate-200 px-4 py-2 font-black" type="button" onClick={() => setDraft(emptyDraft)}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <DataTable
        rows={items}
        columns={columns}
        getRowKey={(row) => row.id}
        emptyState="No homepage news cards yet. Add one here; it will appear on the homepage only after it is visible."
        actions={(row) => (
          <div className="flex flex-wrap gap-2">
            <button className="focus-ring rounded border border-slate-200 px-3 py-1.5 text-xs font-black" onClick={() => edit(row)}>
              Edit
            </button>
            <button className="focus-ring rounded border border-slate-200 px-3 py-1.5 text-xs font-black" disabled={busyId === row.id} onClick={() => toggle(row)}>
              {row.published ? "Hide" : "Publish"}
            </button>
            <button className="focus-ring rounded bg-red-700 px-3 py-1.5 text-xs font-black text-white" disabled={busyId === row.id} onClick={() => remove(row)}>
              Delete
            </button>
          </div>
        )}
      />
    </div>
  );
}

function serializeFromApi(item: HomepageNewsItem): AdminHomepageNewsItem {
  return {
    ...item,
    createdAt: new Date(item.createdAt).toISOString(),
    updatedAt: new Date(item.updatedAt).toISOString()
  };
}
