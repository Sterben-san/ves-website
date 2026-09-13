"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import type { TeamMember, TeamSocialLink, TeamSocialPlatform } from "@/server/domain/entities";
import { adminFetch } from "../../_components/adminFetch";
import { DataTable, type DataTableColumn } from "../../_components/DataTable";
import { useConfirm } from "../../_components/ConfirmDialog";
import { useToast } from "../../_components/Toast";

export type AdminTeamMember = Omit<TeamMember, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

type Draft = {
  id?: string;
  fullName: string;
  role: string;
  bio: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  socials: TeamSocialLink[];
  active: boolean;
  photoUrl?: string;
  file?: File;
  removePhoto?: boolean;
};

const emptyDraft: Draft = {
  fullName: "",
  role: "",
  bio: "",
  email: "",
  phone: "",
  linkedinUrl: "",
  socials: [],
  active: true
};

const platforms: TeamSocialPlatform[] = ["instagram", "linkedin", "x", "github", "website", "other"];

export function TeamDashboardClient({ initialMembers }: { initialMembers: AdminTeamMember[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [dragId, setDragId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const confirm = useConfirm();
  const toast = useToast();

  const columns = useMemo<Array<DataTableColumn<AdminTeamMember>>>(
    () => [
      {
        key: "member",
        header: "Member",
        render: (row) => (
          <div className="flex items-center gap-3">
            <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded bg-slate-900 text-sm font-black text-ves-lime">
              {row.photoUrl ? <Image src={row.photoUrl} alt="" fill sizes="48px" className="object-cover" /> : initials(row.fullName)}
            </div>
            <div>
              <p className="font-black text-slate-950">{row.fullName}</p>
              <p className="text-xs font-semibold text-slate-500">{row.role}</p>
            </div>
          </div>
        )
      },
      {
        key: "contact",
        header: "Contact",
        render: (row) => (
          <div className="grid gap-1 text-xs font-semibold text-slate-600">
            <a className="text-ves-leaf" href={`mailto:${row.email}`}>{row.email}</a>
            {row.phone ? <a href={`tel:${row.phone.replace(/\s+/g, "")}`}>{row.phone}</a> : <span>No phone</span>}
          </div>
        )
      },
      {
        key: "active",
        header: "Status",
        render: (row) => <span className={`rounded px-2 py-1 text-xs font-black ${row.active ? "bg-ves-lime text-ves-ink" : "bg-slate-100 text-slate-500"}`}>{row.active ? "Visible" : "Hidden"}</span>
      },
      { key: "updated", header: "Updated", render: (row) => new Date(row.updatedAt).toLocaleDateString() }
    ],
    []
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validUrl(draft.linkedinUrl)) {
      toast({ title: "LinkedIn URL must be valid", variant: "error" });
      return;
    }
    for (const social of draft.socials) {
      if (!validUrl(social.url)) {
        toast({ title: "Social URL must be valid", body: `${social.platform} has an invalid URL.`, variant: "error" });
        return;
      }
    }

    setSaving(true);
    try {
      const form = new FormData();
      form.set("fullName", draft.fullName);
      form.set("role", draft.role);
      form.set("bio", draft.bio);
      form.set("email", draft.email);
      form.set("phone", draft.phone);
      form.set("linkedinUrl", draft.linkedinUrl);
      form.set("socials", JSON.stringify(draft.socials.filter((social) => social.url.trim())));
      form.set("active", String(draft.active));
      if (draft.removePhoto) form.set("removePhoto", "true");
      if (draft.file) form.set("file", draft.file);

      const response = await adminFetch(draft.id ? `/api/admin/team/${draft.id}` : "/api/admin/team", {
        method: draft.id ? "PATCH" : "POST",
        body: form
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save team member.");
      const saved = serializeFromApi(payload.member);
      setMembers((current) => (draft.id ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current]));
      setDraft(emptyDraft);
      toast({ title: "Team member saved", variant: "success" });
    } catch (error) {
      toast({ title: "Save failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function toggle(row: AdminTeamMember) {
    setBusyId(row.id);
    try {
      const form = new FormData();
      form.set("active", String(!row.active));
      const response = await adminFetch(`/api/admin/team/${row.id}`, { method: "PATCH", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to update visibility.");
      setMembers((current) => current.map((item) => (item.id === row.id ? serializeFromApi(payload.member) : item)));
      toast({ title: "Visibility updated", variant: "success" });
    } catch (error) {
      toast({ title: "Update failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(row: AdminTeamMember) {
    const ok = await confirm({ title: "Delete team member?", body: "This removes the contact card from the public website.", destructiveLabel: "Delete" });
    if (!ok) return;
    setBusyId(row.id);
    try {
      const response = await adminFetch(`/api/admin/team/${row.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to delete team member.");
      setMembers((current) => current.filter((item) => item.id !== row.id));
      toast({ title: "Team member deleted", variant: "success" });
    } catch (error) {
      toast({ title: "Delete failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function reorder(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const from = members.findIndex((member) => member.id === dragId);
    const to = members.findIndex((member) => member.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...members];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setMembers(next);
    try {
      const response = await adminFetch("/api/admin/team/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((member) => member.id) })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to reorder team members.");
      setMembers(payload.members.map(serializeFromApi));
    } catch (error) {
      toast({ title: "Reorder failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    }
  }

  function edit(row: AdminTeamMember) {
    setDraft({
      id: row.id,
      fullName: row.fullName,
      role: row.role,
      bio: row.bio,
      email: row.email,
      phone: row.phone ?? "",
      linkedinUrl: row.linkedinUrl,
      socials: row.socials,
      active: row.active,
      photoUrl: row.photoUrl
    });
  }

  function updateSocial(index: number, update: Partial<TeamSocialLink>) {
    setDraft((current) => ({
      ...current,
      socials: current.socials.map((social, socialIndex) => (socialIndex === index ? { ...social, ...update } : social))
    }));
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setDraft((current) => ({ ...current, file, removePhoto: false }));
    }
  }

  const previewUrl = draft.file ? URL.createObjectURL(draft.file) : draft.photoUrl;

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <form className="grid gap-4 self-start rounded border border-slate-200 bg-white p-5 shadow-sm" onSubmit={save}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">{draft.id ? "Edit member" : "Add member"}</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">Name, role, email, and LinkedIn are required.</p>
          </div>
          {draft.id ? (
            <button className="focus-ring rounded border border-slate-200 px-3 py-1.5 text-xs font-black" type="button" onClick={() => setDraft(emptyDraft)}>
              New
            </button>
          ) : null}
        </div>

        <div className="grid gap-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded bg-slate-900 text-ves-lime">
            {previewUrl ? <Image src={previewUrl} alt="" fill sizes="420px" className="object-cover" unoptimized={previewUrl.startsWith("blob:")} /> : <div className="grid h-full place-items-center text-5xl font-black">{initials(draft.fullName || "VES")}</div>}
          </div>
          <input accept="image/jpeg,image/png,image/webp" className="text-sm font-semibold" type="file" onChange={chooseFile} />
          {draft.photoUrl || draft.file ? (
            <label className="flex items-center gap-2 text-sm font-black text-slate-700">
              <input checked={Boolean(draft.removePhoto)} type="checkbox" onChange={(event) => setDraft((current) => ({ ...current, removePhoto: event.target.checked, file: event.target.checked ? undefined : current.file }))} />
              Remove current photo
            </label>
          ) : null}
        </div>

        <Field label="Full name" required value={draft.fullName} onChange={(value) => setDraft((current) => ({ ...current, fullName: value }))} />
        <Field label="Role / title" required value={draft.role} onChange={(value) => setDraft((current) => ({ ...current, role: value }))} />
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Bio
          <textarea className="focus-ring min-h-24 rounded border border-slate-200 px-3 py-2 font-semibold leading-7" value={draft.bio} onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))} />
        </label>
        <Field label="Email" required type="email" value={draft.email} onChange={(value) => setDraft((current) => ({ ...current, email: value }))} />
        <Field label="Phone" value={draft.phone} onChange={(value) => setDraft((current) => ({ ...current, phone: value }))} />
        <Field label="LinkedIn URL" required type="url" value={draft.linkedinUrl} onChange={(value) => setDraft((current) => ({ ...current, linkedinUrl: value }))} />

        <div className="grid gap-3 rounded border border-slate-200 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-slate-700">Extra social links</p>
            <button className="focus-ring rounded border border-slate-200 px-3 py-1.5 text-xs font-black" type="button" onClick={() => setDraft((current) => ({ ...current, socials: [...current.socials, { platform: "instagram", url: "" }] }))}>
              Add
            </button>
          </div>
          {draft.socials.map((social, index) => (
            <div className="grid gap-2 md:grid-cols-[120px_1fr_auto]" key={`${social.platform}-${index}`}>
              <select className="focus-ring rounded border border-slate-200 px-2 py-2 text-sm font-bold" value={social.platform} onChange={(event) => updateSocial(index, { platform: event.target.value as TeamSocialPlatform })}>
                {platforms.map((platform) => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
              <input className="focus-ring rounded border border-slate-200 px-3 py-2 text-sm font-semibold" type="url" value={social.url} onChange={(event) => updateSocial(index, { url: event.target.value })} />
              <button className="focus-ring rounded bg-red-700 px-3 py-2 text-xs font-black text-white" type="button" onClick={() => setDraft((current) => ({ ...current, socials: current.socials.filter((_, socialIndex) => socialIndex !== index) }))}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm font-black text-slate-700">
          <input checked={draft.active} type="checkbox" onChange={(event) => setDraft((current) => ({ ...current, active: event.target.checked }))} />
          Visible on public website
        </label>

        <button className="focus-ring rounded bg-ves-ink px-4 py-2 font-black text-white disabled:opacity-50" disabled={saving}>
          {saving ? "Saving..." : "Save Team Member"}
        </button>
      </form>

      <div className="grid gap-6">
        <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Display order</h2>
          <div className="mt-4 grid gap-3">
            {members.map((member) => (
              <div
                className="cursor-move rounded border border-slate-200 p-3 text-sm font-black text-slate-700"
                draggable
                key={member.id}
                onDragEnd={() => setDragId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={() => setDragId(member.id)}
                onDrop={() => reorder(member.id)}
              >
                <span>{member.fullName}</span>
                <span className="ml-2 font-semibold text-slate-500">{member.role}</span>
              </div>
            ))}
          </div>
        </section>

        <DataTable
          rows={members}
          columns={columns}
          getRowKey={(row) => row.id}
          emptyState="No team members yet."
          actions={(row) => (
            <div className="flex flex-wrap gap-2">
              <button className="focus-ring rounded border border-slate-200 px-3 py-1.5 text-xs font-black" disabled={busyId === row.id} onClick={() => edit(row)}>
                Edit
              </button>
              <button className="focus-ring rounded border border-slate-200 px-3 py-1.5 text-xs font-black" disabled={busyId === row.id} onClick={() => toggle(row)}>
                {row.active ? "Hide" : "Show"}
              </button>
              <button className="focus-ring rounded bg-red-700 px-3 py-1.5 text-xs font-black text-white" disabled={busyId === row.id} onClick={() => remove(row)}>
                Delete
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange(value: string): void; required?: boolean; type?: string }) {
  return (
    <label className="grid gap-1 text-sm font-black text-slate-700">
      {label}
      <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function serializeFromApi(member: TeamMember): AdminTeamMember {
  return {
    ...member,
    createdAt: new Date(member.createdAt).toISOString(),
    updatedAt: new Date(member.updatedAt).toISOString()
  };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function validUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
