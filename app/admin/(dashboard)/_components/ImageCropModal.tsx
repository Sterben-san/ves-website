"use client";

import { useEffect, useMemo, useState } from "react";

export type CropSource = {
  file: File;
  aspectRatio: number;
  maxWidth?: number;
};

export function ImageCropModal({
  source,
  onCancel,
  onConfirm
}: {
  source: CropSource | null;
  onCancel(): void;
  onConfirm(file: File): void;
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const previewUrl = useMemo(() => (source ? URL.createObjectURL(source.file) : ""), [source]);

  useEffect(
    () => () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl]
  );

  if (!source) {
    return null;
  }

  const activeSource = source;

  async function confirmCrop() {
    const file = await renderCenterCrop(activeSource.file, activeSource.aspectRatio, activeSource.maxWidth, rotation, zoom);
    onConfirm(file);
  }

  return (
    <div className="fixed inset-0 z-[75] overflow-y-auto bg-slate-950/60 p-3 sm:grid sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="crop-title">
      <div className="mx-auto w-full max-w-3xl rounded bg-white p-4 shadow-soft sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-black text-slate-950" id="crop-title">
              Crop Image
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Centered crop locked to {formatRatio(source.aspectRatio)}. Exported as WebP.</p>
          </div>
          <button className="focus-ring rounded border border-slate-200 px-3 py-2 text-sm font-bold sm:self-start" onClick={onCancel}>
            Close
          </button>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-[1fr_220px]">
          <div className="grid min-h-[240px] place-items-center overflow-hidden rounded bg-slate-100 sm:min-h-[360px]">
            {/* eslint-disable-next-line @next/next/no-img-element -- Local blob preview needs transform controls before upload. */}
            <img
              alt="Crop preview"
              className="max-h-[430px] max-w-full object-contain"
              src={previewUrl}
              style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
            />
          </div>
          <div className="grid content-start gap-4">
            <label className="grid gap-2 text-sm font-bold text-slate-800">
              Zoom
              <input min="1" max="2.5" step="0.05" type="range" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
            </label>
            <div>
              <p className="text-sm font-bold text-slate-800">Rotate</p>
              <div className="mt-2 flex gap-2">
                <button className="focus-ring rounded border border-slate-200 px-3 py-2 text-sm font-bold" onClick={() => setRotation((value) => value - 90)}>
                  -90
                </button>
                <button className="focus-ring rounded border border-slate-200 px-3 py-2 text-sm font-bold" onClick={() => setRotation((value) => value + 90)}>
                  +90
                </button>
              </div>
            </div>
            <button className="focus-ring rounded border border-slate-200 px-4 py-3 font-black" onClick={() => { setZoom(1); setRotation(0); }}>
              Reset
            </button>
            <button className="focus-ring rounded bg-ves-leaf px-4 py-3 font-black text-white" onClick={confirmCrop}>
              Use Cropped Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

async function renderCenterCrop(file: File, aspectRatio: number, maxWidth = 1200, rotation: number, zoom: number) {
  const bitmap = await createImageBitmap(file);
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const sourceWidth = normalizedRotation === 90 || normalizedRotation === 270 ? bitmap.height : bitmap.width;
  const sourceHeight = normalizedRotation === 90 || normalizedRotation === 270 ? bitmap.width : bitmap.height;
  const cropWidth = Math.min(sourceWidth / zoom, (sourceHeight / zoom) * aspectRatio);
  const cropHeight = cropWidth / aspectRatio;
  const outputWidth = Math.min(Math.round(maxWidth), Math.round(cropWidth));
  const outputHeight = Math.round(outputWidth / aspectRatio);

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to prepare crop canvas.");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outputWidth, outputHeight);
  ctx.save();
  ctx.translate(outputWidth / 2, outputHeight / 2);
  ctx.rotate((normalizedRotation * Math.PI) / 180);
  const scale = Math.max(outputWidth / cropWidth, outputHeight / cropHeight) * zoom;
  ctx.scale(scale, scale);
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
  ctx.restore();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("Unable to export cropped image."))), "image/webp", 0.85);
  });

  return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" });
}

function formatRatio(ratio: number) {
  if (ratio === 1) {
    return "1:1";
  }
  if (Math.abs(ratio - 16 / 9) < 0.01) {
    return "16:9";
  }
  if (Math.abs(ratio - 4 / 3) < 0.01) {
    return "4:3";
  }
  return ratio.toFixed(2);
}
