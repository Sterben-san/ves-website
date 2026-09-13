"use client";

import Image from "next/image";
import { ChangeEvent, useState } from "react";
import type { SectionMedia, SectionSlot } from "@/server/domain/entities";
import type { MediaMap } from "@/lib/media";
import { adminFetch } from "../../_components/adminFetch";
import { ImageCropModal, type CropSource } from "../../_components/ImageCropModal";
import { useConfirm } from "../../_components/ConfirmDialog";
import { useToast } from "../../_components/Toast";

type UploadState = {
  sectionKey: string;
  progress: number;
};

export function MediaManagerClient({ slots, initialMedia }: { slots: SectionSlot[]; initialMedia: MediaMap }) {
  const [media, setMedia] = useState(initialMedia);
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [crop, setCrop] = useState<(CropSource & { slot: SectionSlot }) | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  async function handleFile(slot: SectionSlot, file: File) {
    if (file.type.startsWith("video/") && !slot.allowVideo) {
      toast({ title: "Video not allowed", body: `${slot.label} accepts images only.`, variant: "error" });
      return;
    }

    if (slot.aspectRatio && file.type.startsWith("image/")) {
      const dimensions = await getImageDimensions(file);
      const actual = dimensions.width / dimensions.height;
      if (Math.abs(actual - slot.aspectRatio) > 0.025) {
        setCrop({ file, aspectRatio: slot.aspectRatio, maxWidth: slot.maxWidth, slot });
        return;
      }
    }

    await uploadFile(slot, file);
  }

  async function uploadFile(slot: SectionSlot, file: File) {
    const previous = media[slot.sectionKey];
    const localUrl = URL.createObjectURL(file);
    setMedia((current) => ({
      ...current,
      [slot.sectionKey]: {
        ...previous,
        sectionKey: slot.sectionKey,
        id: previous?.id ?? slot.sectionKey,
        mediaType: file.type.startsWith("video/") ? "video" : "image",
        url: localUrl,
        publicId: previous?.publicId ?? "",
        altText: previous?.altText ?? slot.defaultAltText,
        updatedAt: new Date()
      }
    }));

    try {
      const saved = await uploadWithProgress(slot, file, previous?.altText ?? slot.defaultAltText, (progress) => {
        setUpload({ sectionKey: slot.sectionKey, progress });
      });
      setMedia((current) => ({ ...current, [slot.sectionKey]: saved }));
      toast({ title: "Media updated", body: slot.label, variant: "success" });
    } catch (error) {
      setMedia((current) => ({ ...current, [slot.sectionKey]: previous }));
      toast({ title: "Upload failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      URL.revokeObjectURL(localUrl);
      setUpload(null);
    }
  }

  async function reset(slot: SectionSlot) {
    const ok = await confirm({
      title: "Reset media?",
      body: `${slot.label} will fall back to its default placeholder.`,
      destructiveLabel: "Reset"
    });
    if (!ok) {
      return;
    }

    const response = await adminFetch(`/api/admin/media/${encodeURIComponent(slot.sectionKey)}`, { method: "DELETE" });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      toast({ title: "Reset failed", body: body?.error ?? "Try again.", variant: "error" });
      return;
    }
    setMedia((current) => ({ ...current, [slot.sectionKey]: body.media }));
    toast({ title: "Reset complete", body: slot.label, variant: "success" });
  }

  async function saveAlt(slot: SectionSlot, value: string) {
    const response = await adminFetch(`/api/admin/media/${encodeURIComponent(slot.sectionKey)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ altText: value })
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      toast({ title: "Alt text not saved", body: body?.error ?? "Alt text is required.", variant: "error" });
      return;
    }
    setMedia((current) => ({ ...current, [slot.sectionKey]: body.media }));
    toast({ title: "Alt text saved", body: slot.label, variant: "success" });
  }

  return (
    <>
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {slots.map((slot) => {
          const item = media[slot.sectionKey];
          const busy = upload?.sectionKey === slot.sectionKey;
          return (
            <article
              className="group rounded border border-slate-200 bg-white p-4 shadow-sm transition hover:border-ves-leaf"
              key={slot.sectionKey}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files[0];
                if (file) {
                  void handleFile(slot, file);
                }
              }}
            >
              <div
                className="relative overflow-hidden rounded bg-slate-100"
                style={{ aspectRatio: slot.aspectRatio ? String(slot.aspectRatio) : "16 / 9" }}
                onMouseEnter={(event) => event.currentTarget.querySelector("video")?.play()}
                onMouseLeave={(event) => {
                  const video = event.currentTarget.querySelector("video");
                  if (video) {
                    video.pause();
                  }
                }}
              >
                {item?.mediaType === "video" ? (
                  <video className="h-full w-full object-cover" src={item.url} muted loop playsInline />
                ) : (
                  <Image src={item?.url ?? slot.defaultUrl} alt={item?.altText ?? slot.defaultAltText} fill className="object-cover" />
                )}
                {busy ? (
                  <div className="absolute inset-x-3 bottom-3 overflow-hidden rounded bg-white/80">
                    <div className="h-2 bg-ves-leaf transition-all" style={{ width: `${upload.progress}%` }} />
                  </div>
                ) : null}
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="font-black text-slate-950">{slot.label}</h2>
                  <p className="mt-1 break-all text-xs font-bold text-slate-400">{slot.sectionKey}</p>
                </div>
                <div className="flex flex-wrap gap-1 sm:flex-col sm:items-end">
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">{slot.aspectRatio ? formatRatio(slot.aspectRatio) : "Free"}</span>
                  {slot.allowVideo ? <span className="rounded bg-ves-lime/20 px-2 py-1 text-xs font-black text-ves-black">Video enabled</span> : null}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500">
                <span>{item?.width && item.height ? `${item.width}x${item.height}` : "Dimensions unknown"}</span>
                <span>{item?.bytes ? formatBytes(item.bytes) : "Size unknown"}</span>
                <span className="col-span-2">Updated {relativeTime(item?.updatedAt)}</span>
              </div>
              <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
                Alt text
                <input
                  className={`focus-ring rounded border px-3 py-2 ${item?.altText ? "border-slate-200" : "border-amber-400 bg-amber-50"}`}
                  defaultValue={item?.altText ?? slot.defaultAltText}
                  onBlur={(event) => {
                    if (event.target.value !== item?.altText) {
                      void saveAlt(slot, event.target.value);
                    }
                  }}
                />
              </label>
              {!item?.altText ? <p className="mt-2 rounded bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">Alt text required.</p> : null}
              <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
                <label className="focus-within:outline focus-within:outline-3 focus-within:outline-ves-lime rounded bg-ves-leaf px-4 py-2 text-center text-sm font-black text-white">
                  Replace
                  <input
                    className="sr-only"
                    disabled={busy}
                    type="file"
                    accept={slot.allowVideo ? "image/jpeg,image/png,image/webp,video/mp4,video/webm" : "image/jpeg,image/png,image/webp"}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void handleFile(slot, file);
                      }
                      event.target.value = "";
                    }}
                  />
                </label>
                <button className="focus-ring rounded border border-slate-200 px-4 py-2 text-sm font-black" disabled={busy} onClick={() => void reset(slot)}>
                  Reset to default
                </button>
              </div>
            </article>
          );
        })}
      </section>
      <ImageCropModal
        source={crop}
        onCancel={() => setCrop(null)}
        onConfirm={(file) => {
          const slot = crop?.slot;
          setCrop(null);
          if (slot) {
            void uploadFile(slot, file);
          }
        }}
      />
    </>
  );
}

function uploadWithProgress(slot: SectionSlot, file: File, altText: string, onProgress: (progress: number) => void, retried = false) {
  return new Promise<SectionMedia>((resolve, reject) => {
    const body = new FormData();
    body.set("file", file);
    body.set("altText", altText);
    const request = new XMLHttpRequest();
    request.open("POST", `/api/admin/media/${encodeURIComponent(slot.sectionKey)}`);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = async () => {
      const payload = JSON.parse(request.responseText || "{}");
      if (request.status >= 200 && request.status < 300) {
        resolve(payload.media);
      } else if (request.status === 401 && !retried) {
        const refreshed = await fetch("/api/auth/refresh", { method: "POST" });
        if (refreshed.ok) {
          uploadWithProgress(slot, file, altText, onProgress, true).then(resolve).catch(reject);
          return;
        }
        reject(new Error(payload.error ?? "Authentication required."));
      } else {
        reject(new Error(payload.error ?? "Upload failed."));
      }
    };
    request.onerror = () => reject(new Error("Upload failed."));
    request.send(body);
  });
}

function getImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new window.Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image dimensions."));
    };
    image.src = url;
  });
}

function formatRatio(ratio: number) {
  if (ratio === 1) return "1:1";
  if (Math.abs(ratio - 16 / 9) < 0.01) return "16:9";
  if (Math.abs(ratio - 4 / 3) < 0.01) return "4:3";
  return ratio.toFixed(2);
}

function formatBytes(bytes: number) {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function relativeTime(value?: Date | string) {
  if (!value) return "never";
  const date = new Date(value);
  if (date.getTime() === 0) return "default";
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
