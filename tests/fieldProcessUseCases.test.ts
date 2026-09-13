import { describe, expect, it } from "vitest";
import { defaultFieldProcessSteps, ListFieldProcessStepsForAdminUseCase, ListFieldProcessStepsUseCase, UpdateFieldProcessStepUseCase } from "@/server/application/fieldProcessUseCases";
import type { FieldProcessStep } from "@/server/domain/entities";
import type { IFieldProcessRepository } from "@/server/domain/repositories";

class FakeFieldProcessRepository implements IFieldProcessRepository {
  records = new Map<string, FieldProcessStep>();

  async list() {
    return [...this.records.values()].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async findById(id: string) {
    return this.records.get(id) ?? null;
  }

  async findByStepKey(stepKey: string) {
    return [...this.records.values()].find((step) => step.stepKey === stepKey) ?? null;
  }

  async upsertByStepKey(step: Omit<FieldProcessStep, "id" | "createdAt" | "updatedAt">) {
    const existing = await this.findByStepKey(step.stepKey);
    if (existing) return existing;
    const now = new Date();
    const record = { ...step, id: step.stepKey, createdAt: now, updatedAt: now };
    this.records.set(record.id, record);
    return record;
  }

  async update(id: string, step: Partial<Omit<FieldProcessStep, "id" | "stepKey" | "createdAt" | "updatedAt">>) {
    const current = this.records.get(id);
    if (!current) return null;
    const saved = { ...current, ...step, updatedAt: new Date() };
    this.records.set(id, saved);
    return saved;
  }
}

describe("field process use cases", () => {
  it("returns fallback steps for the public homepage when no records exist", async () => {
    const steps = await new ListFieldProcessStepsUseCase(new FakeFieldProcessRepository()).execute();

    expect(steps).toHaveLength(5);
    expect(steps[0].phase).toBe(defaultFieldProcessSteps[0].phase);
  });

  it("seeds missing admin steps without overwriting existing edits", async () => {
    const repo = new FakeFieldProcessRepository();
    await repo.upsertByStepKey({ ...defaultFieldProcessSteps[0], phase: "Edited review step" });

    const steps = await new ListFieldProcessStepsForAdminUseCase(repo).execute();

    expect(steps).toHaveLength(5);
    expect(steps[0].phase).toBe("Edited review step");
  });

  it("updates editable title and description with trimming", async () => {
    const repo = new FakeFieldProcessRepository();
    const [step] = await new ListFieldProcessStepsForAdminUseCase(repo).execute();

    const updated = await new UpdateFieldProcessStepUseCase(repo).execute(step.id, {
      phase: "  Survey and approvals  ",
      copy: "  Updated public journey text.  "
    });

    expect(updated.phase).toBe("Survey and approvals");
    expect(updated.copy).toBe("Updated public journey text.");
  });

  it("rejects blank edits", async () => {
    const repo = new FakeFieldProcessRepository();
    const [step] = await new ListFieldProcessStepsForAdminUseCase(repo).execute();

    await expect(new UpdateFieldProcessStepUseCase(repo).execute(step.id, { phase: "", copy: "Valid copy" })).rejects.toThrow("Step title is required.");
  });
});
