"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Announcement } from "@/server/domain/entities";
import { adminFetch } from "../../_components/adminFetch";
import { DataTable, type DataTableColumn } from "../../_components/DataTable";
import { useConfirm } from "../../_components/ConfirmDialog";
import { useToast } from "../../_components/Toast";

export type AdminAnnouncement = Omit<Announcement, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export function AnnouncementDashboardClient({ initialAnnouncements }: { initialAnnouncements: AdminAnnouncement[] }) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [busyId, setBusyId] = useState<string | null>(null);
  const confirm = useConfirm();
  const toast = useToast();

  const columns = useMemo<Array<DataTableColumn<AdminAnnouncement>>>(
    () => [
      {
        key: "title",
        header: "Title",
        render: (row) => (
          <div>
            <p className="font-black text-slate-950">{row.title}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">/{row.slug}</p>
          </div>
        )
      },
      { key: "kind", header: "Kind", render: (row) => <span className="capitalize">{row.kind}</span> },
      {
        key: "status",
        header: "Status",
        render: (row) => (
          <div className="flex flex-wrap gap-2">
            <span className={`rounded px-2 py-1 text-xs font-black ${row.published ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-500"}`}>
              {row.published ? "Published" : "Draft"}
            </span>
            {row.pinned ? <span className="rounded bg-ves-lime px-2 py-1 text-xs font-black text-ves-ink">Pinned</span> : null}
          </div>
        )
      },
      { key: "updated", header: "Updated", render: (row) => new Date(row.updatedAt).toLocaleDateString() }
    ],
    []
  );

  async function patchAnnouncement(id: string, form: FormData) {
    setBusyId(id);
    try {
      const response = await adminFetch(`/api/admin/announcements/${id}`, { method: "PATCH", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to update announcement.");
      setAnnouncements((current) => current.map((item) => (item.id === id ? serializeFromApi(payload.announcement) : item)));
      toast({ title: "Announcement updated", variant: "success" });
    } catch (error) {
      toast({ title: "Update failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function togglePublished(row: AdminAnnouncement) {
    const form = new FormData();
    form.set("published", String(!row.published));
    await patchAnnouncement(row.id, form);
  }

  async function pin(row: AdminAnnouncement) {
    setBusyId(row.id);
    try {
      const response = await adminFetch(`/api/admin/announcements/${row.id}/pin`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to pin announcement.");
      const pinned = serializeFromApi(payload.announcement);
      setAnnouncements((current) => current.map((item) => (item.id === row.id ? pinned : { ...item, pinned: false })));
      toast({ title: "Homepage hero updated", variant: "success" });
    } catch (error) {
      toast({ title: "Pin failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(row: AdminAnnouncement) {
    const ok = await confirm({
      title: "Delete announcement?",
      body: `This removes "${row.title}" from the admin and public site.`,
      destructiveLabel: "Delete"
    });
    if (!ok) return;
    setBusyId(row.id);
    try {
      const response = await adminFetch(`/api/admin/announcements/${row.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to delete announcement.");
      setAnnouncements((current) => current.filter((item) => item.id !== row.id));
      toast({ title: "Announcement deleted", variant: "success" });
    } catch (error) {
      toast({ title: "Delete failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-6">
      <DataTable
        rows={announcements}
        columns={columns}
        getRowKey={(row) => row.id}
        emptyState="No announcements yet."
        actions={(row) => (
          <div className="flex flex-wrap gap-2">
            <Link className="focus-ring rounded border border-slate-200 px-3 py-1.5 text-xs font-black" href={`/admin/dashboard/announcements/${row.id}`}>
              Edit
            </Link>
            <button className="focus-ring rounded border border-slate-200 px-3 py-1.5 text-xs font-black" disabled={busyId === row.id} onClick={() => togglePublished(row)}>
              {row.published ? "Unpublish" : "Publish"}
            </button>
            <button className="focus-ring rounded border border-slate-200 px-3 py-1.5 text-xs font-black" disabled={busyId === row.id || row.pinned} onClick={() => pin(row)}>
              Pin
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

function serializeFromApi(announcement: Announcement): AdminAnnouncement {
  return {
    ...announcement,
    createdAt: new Date(announcement.createdAt).toISOString(),
    updatedAt: new Date(announcement.updatedAt).toISOString()
  };
}
