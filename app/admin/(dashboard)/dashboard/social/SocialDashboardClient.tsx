"use client";

import { FormEvent, useMemo, useState } from "react";
import { SocialEmbed } from "../../../../(public)/components/SocialEmbed";
import type { SocialLink, SocialPlatform } from "@/server/domain/entities";
import { adminFetch } from "../../_components/adminFetch";
import { DataTable, type DataTableColumn } from "../../_components/DataTable";
import { useConfirm } from "../../_components/ConfirmDialog";
import { useToast } from "../../_components/Toast";

export type AdminSocialLink = Omit<SocialLink, "createdAt"> & {
  createdAt: string;
};

export function SocialDashboardClient({ initialLinks }: { initialLinks: AdminSocialLink[] }) {
  const [links, setLinks] = useState(initialLinks);
  const [postUrl, setPostUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [featured, setFeatured] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const confirm = useConfirm();
  const toast = useToast();
  const detected = detectSocial(postUrl);
  const featuredLinks = links.filter((link) => link.featured);

  const columns = useMemo<Array<DataTableColumn<AdminSocialLink>>>(
    () => [
      {
        key: "post",
        header: "Post",
        render: (row) => (
          <div>
            <p className="font-black capitalize text-slate-950">{row.platform}</p>
            <a className="mt-1 block max-w-sm truncate text-xs font-semibold text-ves-leaf" href={row.postUrl} rel="noreferrer" target="_blank">
              {row.postUrl}
            </a>
          </div>
        )
      },
      {
        key: "featured",
        header: "Featured",
        render: (row) => <span className={`rounded px-2 py-1 text-xs font-black ${row.featured ? "bg-ves-lime text-ves-ink" : "bg-slate-100 text-slate-500"}`}>{row.featured ? "Featured" : "Hidden"}</span>
      },
      { key: "created", header: "Added", render: (row) => new Date(row.createdAt).toLocaleDateString() }
    ],
    []
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detected) {
      toast({ title: "Use a public Instagram or LinkedIn post URL", variant: "error" });
      return;
    }
    if (featured && featuredLinks.length >= 4) {
      toast({ title: "Featured limit reached", body: "Unfeature another link before adding this one to the homepage.", variant: "error" });
      return;
    }

    setSaving(true);
    try {
      const response = await adminFetch("/api/admin/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postUrl, caption, featured })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save social link.");
      setLinks((current) => [serializeFromApi(payload.link), ...current]);
      setPostUrl("");
      setCaption("");
      setFeatured(false);
      toast({ title: "Social link added", variant: "success" });
    } catch (error) {
      toast({ title: "Save failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function toggle(row: AdminSocialLink) {
    if (!row.featured && featuredLinks.length >= 4) {
      toast({ title: "Featured limit reached", body: "Only four links appear on the homepage.", variant: "error" });
      return;
    }
    setBusyId(row.id);
    try {
      const response = await adminFetch(`/api/admin/social/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !row.featured })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to update social link.");
      setLinks((current) => current.map((item) => (item.id === row.id ? serializeFromApi(payload.link) : item)));
      toast({ title: "Social link updated", variant: "success" });
    } catch (error) {
      toast({ title: "Update failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(row: AdminSocialLink) {
    const ok = await confirm({ title: "Delete social link?", body: "This removes the embed from the public social pages.", destructiveLabel: "Delete" });
    if (!ok) return;
    setBusyId(row.id);
    try {
      const response = await adminFetch(`/api/admin/social/${row.id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to delete social link.");
      setLinks((current) => current.filter((item) => item.id !== row.id));
      toast({ title: "Social link deleted", variant: "success" });
    } catch (error) {
      toast({ title: "Delete failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setBusyId(null);
    }
  }

  async function reorder(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const currentFeatured = links.filter((link) => link.featured);
    const from = currentFeatured.findIndex((link) => link.id === dragId);
    const to = currentFeatured.findIndex((link) => link.id === targetId);
    if (from < 0 || to < 0) return;
    const nextFeatured = [...currentFeatured];
    const [moved] = nextFeatured.splice(from, 1);
    nextFeatured.splice(to, 0, moved);
    const nextIds = nextFeatured.map((link) => link.id);
    setLinks((current) => orderFeatured(current, nextIds));
    try {
      const response = await adminFetch("/api/admin/social/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: nextIds })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to reorder links.");
      setLinks(payload.links.map(serializeFromApi));
    } catch (error) {
      toast({ title: "Reorder failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    }
  }

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <form className="grid gap-4 self-start rounded border border-slate-200 bg-white p-5 shadow-sm" onSubmit={save}>
        <h2 className="text-xl font-black text-slate-950">Add post</h2>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Public URL
          <input className="focus-ring rounded border border-slate-200 px-3 py-2 font-semibold" required type="url" value={postUrl} onChange={(event) => setPostUrl(event.target.value)} />
        </label>
        <p className={`text-xs font-black ${detected ? "text-emerald-700" : "text-slate-500"}`}>{detected ? `${detected} post detected` : "Instagram /p or /reel and LinkedIn post/update URLs are accepted."}</p>
        <label className="grid gap-1 text-sm font-black text-slate-700">
          Caption
          <textarea className="focus-ring min-h-24 rounded border border-slate-200 px-3 py-2 font-semibold leading-7" value={caption} onChange={(event) => setCaption(event.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm font-black text-slate-700">
          <input checked={featured} type="checkbox" onChange={(event) => setFeatured(event.target.checked)} />
          Feature on homepage
        </label>
        <button className="focus-ring rounded bg-ves-ink px-4 py-2 font-black text-white disabled:opacity-50" disabled={saving || !detected}>
          {saving ? "Saving..." : "Save Social Link"}
        </button>
        {detected ? (
          <div className="mt-2">
            <p className="mb-2 text-sm font-black text-slate-700">Preview</p>
            <SocialEmbed caption={caption} platform={detected} postUrl={postUrl} />
          </div>
        ) : null}
      </form>

      <div className="grid gap-6">
        {featuredLinks.length > 0 ? (
          <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Featured order</h2>
            <div className="mt-4 grid gap-3">
              {featuredLinks.map((link) => (
                <div
                  className="cursor-move rounded border border-slate-200 p-3 text-sm font-black text-slate-700"
                  draggable
                  key={link.id}
                  onDragEnd={() => setDragId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDragStart={() => setDragId(link.id)}
                  onDrop={() => reorder(link.id)}
                >
                  <span className="capitalize">{link.platform}</span>
                  <span className="ml-2 font-semibold text-slate-500">{link.caption || link.postUrl}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <DataTable
          rows={links}
          columns={columns}
          getRowKey={(row) => row.id}
          emptyState="No social links yet."
          actions={(row) => (
            <div className="flex flex-wrap gap-2">
              <button className="focus-ring rounded border border-slate-200 px-3 py-1.5 text-xs font-black" disabled={busyId === row.id} onClick={() => toggle(row)}>
                {row.featured ? "Unfeature" : "Feature"}
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

function serializeFromApi(link: SocialLink): AdminSocialLink {
  return {
    ...link,
    createdAt: new Date(link.createdAt).toISOString()
  };
}

function orderFeatured(links: AdminSocialLink[], ids: string[]) {
  const order = new Map(ids.map((id, index) => [id, index]));
  return [...links].sort((a, b) => {
    const aOrder = order.get(a.id) ?? a.sortOrder;
    const bOrder = order.get(b.id) ?? b.sortOrder;
    return aOrder - bOrder;
  });
}
