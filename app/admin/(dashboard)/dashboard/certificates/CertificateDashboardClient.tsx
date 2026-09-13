"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Certificate } from "@/server/domain/entities";
import { adminFetch } from "../../_components/adminFetch";
import { useConfirm } from "../../_components/ConfirmDialog";
import { DataTable, type DataTableColumn } from "../../_components/DataTable";
import { useToast } from "../../_components/Toast";

export type AdminCertificate = Omit<Certificate, "issuedOn" | "createdAt" | "updatedAt"> & {
  issuedOn?: string;
  createdAt: string;
  updatedAt: string;
};

type Draft = {
  id?: string;
  title: string;
  issuer: string;
  description: string;
  issuedOn: string;
  published: boolean;
  file?: File;
};

const emptyDraft: Draft = {
  title: "",
  issuer: "",
  description: "",
  issuedOn: "",
  published: true
};

export function CertificateDashboardClient({ initialCertificates }: { initialCertificates: AdminCertificate[] }) {
  const [certificates, setCertificates] = useState(initialCertificates);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const confirm = useConfirm();
  const toast = useToast();

  const columns = useMemo<Array<DataTableColumn<AdminCertificate>>>(
    () => [
      {
        key: "certificate",
        header: "Certificate",
        render: (row) => (
          <div>
            <p className="font-black text-slate-950">{row.title}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{row.issuer}</p>
          </div>
        )
      },
      {
        key: "status",
        header: "Status",
        render: (row) => <span className={`rounded px-2 py-1 text-xs font-black ${row.published ? "bg-ves-lime text-ves-ink" : "bg-slate-100 text-slate-500"}`}>{row.published ? "Visible" : "Hidden"}</span>
      },
      {
        key: "file",
        header: "PDF",
        render: (row) => (
          <a className="text-xs font-black text-ves-leaf underline-offset-4 hover:underline" href={row.certificateUrl} target="_blank" rel="noreferrer">
            Open PDF
          </a>
        )
      },
      { key: "updated", header: "Updated", render: (row) => new Date(row.updatedAt).toLocaleDateString() }
    ],
    []
  );

  function edit(row: AdminCertificate) {
    setDraft({
      id: row.id,
      title: row.title,
      issuer: row.issuer,
      description: row.description,
      issuedOn: row.issuedOn ? row.issuedOn.slice(0, 10) : "",
      published: row.published
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.id && !draft.file) {
      toast({ title: "Upload a certificate PDF", variant: "error" });
      return;
    }

    setSaving(true);
    const form = new FormData();
    form.set("title", draft.title);
    form.set("issuer", draft.issuer);
    form.set("description", draft.description);
    form.set("issuedOn", draft.issuedOn);
    form.set("published", String(draft.published));
    if (draft.file) form.set("file", draft.file);

    try {
      const response = await adminFetch(draft.id ? `/api/admin/certificates/${draft.id}` : "/api/admin/certificates", {
        method: draft.id ? "PATCH" : "POST",
        body: form
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save certificate.");
      const saved = serializeFromApi(payload.certificate);
      setCertificates((current) => (draft.id ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current]));
      setDraft(emptyDraft);
      toast({ title: "Certificate saved", variant: "success" });
    } catch (error) {
      toast({ title: "Save failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function toggle(row: AdminCertificate) {
    setBusyId(row.id);
    const form = new FormData();
    form.set("published", String(!row.published));
    try {
      const response = await adminFetch(`/api/admin/certificates/${row.id}`, { method: "PATCH", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to update certificate.");
      setCertificates((current) => current.map((item) => (item.id === row.id ? serializeFromApi(payload.certificate) : item)));
      toast({ title: row.published ? "Certificate hidden" : "Certificate published", variant: "success" });
    } catch (error) {
      toast({ title: "Update failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(row: AdminCertificate) {
    const ok = await confirm({ title: "Delete certificate?", body: `This removes "${row.title}" from the public website.`, destructiveLabel: "Delete" });
    if (!ok) return;
    setBusyId(row.id);
    try {
      const response = await adminFetch(`/api/admin/certificates/${row.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to delete certificate.");
      setCertificates((current) => current.filter((item) => item.id !== row.id));
      toast({ title: "Certificate deleted", variant: "success" });
    } catch (error) {
      toast({ title: "Delete failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <form className="grid gap-4 self-start rounded border border-slate-200 bg-white p-5 shadow-sm" onSubmit={save}>
        <h2 className="text-xl font-black text-slate-950">{draft.id ? "Edit certificate" : "New certificate"}</h2>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Title
          <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" required value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
        </label>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Issuer
          <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" required value={draft.issuer} onChange={(event) => setDraft((current) => ({ ...current, issuer: event.target.value }))} />
        </label>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Description
          <textarea className="focus-ring min-h-28 rounded border border-slate-200 px-3 py-2 font-semibold leading-7" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
        </label>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Issued date
          <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" type="date" value={draft.issuedOn} onChange={(event) => setDraft((current) => ({ ...current, issuedOn: event.target.value }))} />
        </label>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          PDF file
          <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" accept="application/pdf" type="file" onChange={(event) => setDraft((current) => ({ ...current, file: event.target.files?.[0] }))} />
          {draft.id ? <span className="text-xs font-semibold text-slate-500">Leave empty to keep the existing PDF.</span> : null}
        </label>
        <label className="flex items-center gap-2 text-sm font-black text-slate-700">
          <input checked={draft.published} type="checkbox" onChange={(event) => setDraft((current) => ({ ...current, published: event.target.checked }))} />
          Visible on public site
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
        rows={certificates}
        columns={columns}
        getRowKey={(row) => row.id}
        emptyState="No certificates yet."
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

function serializeFromApi(certificate: Certificate): AdminCertificate {
  return {
    ...certificate,
    issuedOn: certificate.issuedOn ? new Date(certificate.issuedOn).toISOString() : undefined,
    createdAt: new Date(certificate.createdAt).toISOString(),
    updatedAt: new Date(certificate.updatedAt).toISOString()
  };
}
