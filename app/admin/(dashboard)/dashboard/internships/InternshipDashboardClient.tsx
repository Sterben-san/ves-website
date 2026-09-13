"use client";

import { FormEvent, useMemo, useState } from "react";
import type { InternshipUpdate } from "@/server/domain/entities";
import { adminFetch } from "../../_components/adminFetch";
import { useConfirm } from "../../_components/ConfirmDialog";
import { DataTable, type DataTableColumn } from "../../_components/DataTable";
import { useToast } from "../../_components/Toast";

export type AdminInternship = Omit<InternshipUpdate, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

type Draft = {
  id?: string;
  title: string;
  description: string;
  location: string;
  applyUrl: string;
  applyEmail: string;
  active: boolean;
  file?: File;
  removeAttachment?: boolean;
};

const emptyDraft: Draft = {
  title: "",
  description: "",
  location: "",
  applyUrl: "",
  applyEmail: "",
  active: false
};

export function InternshipDashboardClient({ initialInternships }: { initialInternships: AdminInternship[] }) {
  return (
    <InternshipDashboardInner initialInternships={initialInternships} />
  );
}

function InternshipDashboardInner({ initialInternships }: { initialInternships: AdminInternship[] }) {
  const [internships, setInternships] = useState(initialInternships);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const confirm = useConfirm();
  const toast = useToast();

  const columns = useMemo<Array<DataTableColumn<AdminInternship>>>(
    () => [
      {
        key: "title",
        header: "Title",
        render: (row) => (
          <div>
            <p className="font-black text-slate-950">{row.title}</p>
            {row.location ? <p className="mt-1 text-xs font-semibold text-slate-500">{row.location}</p> : null}
          </div>
        )
      },
      {
        key: "status",
        header: "Status",
        render: (row) => <span className={`rounded px-2 py-1 text-xs font-black ${row.active ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-500"}`}>{row.active ? "Active" : "Inactive"}</span>
      },
      {
        key: "application",
        header: "Application",
        render: (row) => row.applyUrl ? "Google Form attached" : row.applyEmail ? "Email only" : "Not set"
      },
      { key: "updated", header: "Updated", render: (row) => new Date(row.updatedAt).toLocaleDateString() }
    ],
    []
  );

  function edit(row: AdminInternship) {
    setDraft({
      id: row.id,
      title: row.title,
      description: row.description,
      location: row.location ?? "",
      applyUrl: row.applyUrl ?? "",
      applyEmail: row.applyEmail ?? "",
      active: row.active
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData();
    form.set("title", draft.title);
    form.set("description", draft.description);
    form.set("location", draft.location);
    form.set("applyUrl", draft.applyUrl);
    form.set("applyEmail", draft.applyEmail);
    form.set("active", String(draft.active));
    if (draft.file) form.set("file", draft.file);
    if (draft.removeAttachment) form.set("removeAttachment", "true");

    try {
      const response = await adminFetch(draft.id ? `/api/admin/internships/${draft.id}` : "/api/admin/internships", {
        method: draft.id ? "PATCH" : "POST",
        body: form
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save internship.");
      const saved = serializeFromApi(payload.internship);
      setInternships((current) => (draft.id ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current]));
      setDraft(emptyDraft);
      toast({ title: "Internship saved", variant: "success" });
    } catch (error) {
      toast({ title: "Save failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function toggle(row: AdminInternship) {
    setBusyId(row.id);
    const form = new FormData();
    form.set("active", String(!row.active));
    try {
      const response = await adminFetch(`/api/admin/internships/${row.id}`, { method: "PATCH", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to update internship.");
      setInternships((current) => current.map((item) => (item.id === row.id ? serializeFromApi(payload.internship) : item)));
      toast({ title: row.active ? "Internship archived" : "Internship activated", variant: "success" });
    } catch (error) {
      toast({ title: "Update failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(row: AdminInternship) {
    const ok = await confirm({ title: "Delete internship?", body: `This permanently removes "${row.title}".`, destructiveLabel: "Delete" });
    if (!ok) return;
    setBusyId(row.id);
    try {
      const response = await adminFetch(`/api/admin/internships/${row.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to delete internship.");
      setInternships((current) => current.filter((item) => item.id !== row.id));
      toast({ title: "Internship deleted", variant: "success" });
    } catch (error) {
      toast({ title: "Delete failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <form className="grid gap-4 self-start rounded border border-slate-200 bg-white p-5 shadow-sm" onSubmit={save}>
        <h2 className="text-xl font-black text-slate-950">{draft.id ? "Edit internship" : "New internship"}</h2>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Title
          <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" required value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
        </label>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Description
          <textarea className="focus-ring min-h-36 rounded border border-slate-200 px-3 py-2 font-semibold leading-7" required value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
        </label>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Location
          <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} />
        </label>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Google Form URL
          <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" inputMode="url" placeholder="https://forms.gle/..." type="url" value={draft.applyUrl} onChange={(event) => setDraft((current) => ({ ...current, applyUrl: event.target.value }))} />
          <span className="text-xs font-semibold text-slate-500">The public Apply button opens this form in a new tab.</span>
        </label>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Apply Email
          <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" type="email" value={draft.applyEmail} onChange={(event) => setDraft((current) => ({ ...current, applyEmail: event.target.value }))} />
        </label>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Attachment
          <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" accept="image/*,application/pdf" type="file" onChange={(event) => setDraft((current) => ({ ...current, file: event.target.files?.[0] }))} />
        </label>
        {draft.id ? (
          <label className="flex items-center gap-2 text-sm font-black text-slate-700">
            <input checked={Boolean(draft.removeAttachment)} type="checkbox" onChange={(event) => setDraft((current) => ({ ...current, removeAttachment: event.target.checked }))} />
            Remove existing attachment
          </label>
        ) : null}
        <label className="flex items-center gap-2 text-sm font-black text-slate-700">
          <input checked={draft.active} type="checkbox" onChange={(event) => setDraft((current) => ({ ...current, active: event.target.checked }))} />
          Active on public site
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
        rows={internships}
        columns={columns}
        getRowKey={(row) => row.id}
        emptyState="No internships yet."
        actions={(row) => (
          <div className="flex flex-wrap gap-2">
            <button className="focus-ring rounded border border-slate-200 px-3 py-1.5 text-xs font-black" onClick={() => edit(row)}>
              Edit
            </button>
            <button className="focus-ring rounded border border-slate-200 px-3 py-1.5 text-xs font-black" disabled={busyId === row.id} onClick={() => toggle(row)}>
              {row.active ? "Archive" : "Activate"}
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

function serializeFromApi(internship: InternshipUpdate): AdminInternship {
  return {
    ...internship,
    createdAt: new Date(internship.createdAt).toISOString(),
    updatedAt: new Date(internship.updatedAt).toISOString()
  };
}
