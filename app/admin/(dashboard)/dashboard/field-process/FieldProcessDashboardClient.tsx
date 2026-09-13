"use client";

import { FormEvent, useState } from "react";
import type { FieldProcessStep } from "@/server/domain/entities";
import { adminFetch } from "../../_components/adminFetch";
import { useToast } from "../../_components/Toast";

export type AdminFieldProcessStep = Omit<FieldProcessStep, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

type DraftStep = {
  phase: string;
  copy: string;
};

export function FieldProcessDashboardClient({ initialSteps }: { initialSteps: AdminFieldProcessStep[] }) {
  const [steps, setSteps] = useState(initialSteps);
  const [drafts, setDrafts] = useState<Record<string, DraftStep>>(() =>
    Object.fromEntries(initialSteps.map((step) => [step.id, { phase: step.phase, copy: step.copy }]))
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const toast = useToast();

  async function save(event: FormEvent<HTMLFormElement>, step: AdminFieldProcessStep) {
    event.preventDefault();
    const draft = drafts[step.id];
    if (!draft?.phase.trim() || !draft.copy.trim()) {
      toast({ title: "Title and description are required", variant: "error" });
      return;
    }

    setSavingId(step.id);
    try {
      const response = await adminFetch(`/api/admin/field-process/${step.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: draft.phase,
          copy: draft.copy,
          displayOrder: step.displayOrder
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save field process step.");
      const saved = serializeFromApi(payload.step);
      setSteps((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      setDrafts((current) => ({ ...current, [saved.id]: { phase: saved.phase, copy: saved.copy } }));
      toast({ title: "Field process step saved", variant: "success" });
    } catch (error) {
      toast({ title: "Save failed", body: error instanceof Error ? error.message : "Try again.", variant: "error" });
    } finally {
      setSavingId(null);
    }
  }

  function updateDraft(id: string, update: Partial<DraftStep>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...update } }));
  }

  if (steps.length === 0) {
    return (
      <div className="mt-6 rounded border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-900">
        Field process steps are not seeded yet. Run <span className="font-black">npm run seed</span>, then refresh this page.
      </div>
    );
  }

  return (
    <section className="mt-6 grid gap-4">
      {steps.map((step, index) => {
        const draft = drafts[step.id] ?? { phase: step.phase, copy: step.copy };
        const changed = draft.phase !== step.phase || draft.copy !== step.copy;
        return (
          <form className="rounded border border-slate-200 bg-white p-5 shadow-sm" key={step.id} onSubmit={(event) => save(event, step)}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-ves-leaf">Step {String(index + 1).padStart(2, "0")}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">Homepage field process box</p>
              </div>
              <button
                className="focus-ring rounded bg-ves-ink px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={savingId === step.id || !changed}
                type="submit"
              >
                {savingId === step.id ? "Saving..." : changed ? "Save Step" : "Saved"}
              </button>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)]">
              <label className="grid gap-2 text-sm font-black text-slate-700">
                Step title
                <input
                  className="focus-ring rounded border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-950"
                  maxLength={80}
                  onChange={(event) => updateDraft(step.id, { phase: event.target.value })}
                  value={draft.phase}
                />
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-700">
                Step description
                <textarea
                  className="focus-ring min-h-28 rounded border border-slate-200 px-3 py-2 text-sm font-semibold leading-6 text-slate-950"
                  maxLength={260}
                  onChange={(event) => updateDraft(step.id, { copy: event.target.value })}
                  value={draft.copy}
                />
              </label>
            </div>
          </form>
        );
      })}
    </section>
  );
}

function serializeFromApi(step: FieldProcessStep): AdminFieldProcessStep {
  return {
    ...step,
    createdAt: new Date(step.createdAt).toISOString(),
    updatedAt: new Date(step.updatedAt).toISOString()
  };
}
