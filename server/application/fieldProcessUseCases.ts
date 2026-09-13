import type { FieldProcessStep } from "@/server/domain/entities";
import type { IFieldProcessRepository } from "@/server/domain/repositories";

export const defaultFieldProcessSteps: Array<Omit<FieldProcessStep, "id" | "createdAt" | "updatedAt">> = [
  {
    stepKey: "step-1",
    phase: "Government & Site Review",
    copy: "Understand the public-lighting cluster, existing failure pattern, line usage, approval path, and operating conditions.",
    displayOrder: 0
  },
  {
    stepKey: "step-2",
    phase: "Control-Box Manufacturing",
    copy: "Build a field-hardened automatic on/off control unit using light-sensing logic and serviceable hardware.",
    displayOrder: 1
  },
  {
    stepKey: "step-3",
    phase: "Installation & Commissioning",
    copy: "Install with the local supervisor and labour team, verify wiring safety, and test automatic night operation before handover.",
    displayOrder: 2
  },
  {
    stepKey: "step-4",
    phase: "Performance Monitoring",
    copy: "Observe switching behavior, power usage patterns, and field reliability so issues can be corrected before they become recurring failures.",
    displayOrder: 3
  },
  {
    stepKey: "step-5",
    phase: "Warranty & Local Support",
    copy: "Support every installed unit with service access, maintenance follow-up, and a one-year service warranty from the VES team.",
    displayOrder: 4
  }
];

export class ListFieldProcessStepsUseCase {
  constructor(private readonly steps: IFieldProcessRepository) {}

  async execute() {
    const saved = await this.steps.list();
    return saved.length > 0 ? saved : defaultFieldProcessSteps.map(toFallbackStep);
  }
}

export class ListFieldProcessStepsForAdminUseCase {
  constructor(private readonly steps: IFieldProcessRepository) {}

  async execute() {
    await seedMissingSteps(this.steps);
    return this.steps.list();
  }
}

export class UpdateFieldProcessStepUseCase {
  constructor(private readonly steps: IFieldProcessRepository) {}

  async execute(id: string, input: FieldProcessStepInput) {
    const current = await this.steps.findById(id);
    if (!current) {
      throw new Error("Field process step not found.");
    }

    const saved = await this.steps.update(id, {
      phase: required(input.phase, "Step title"),
      copy: required(input.copy, "Step description"),
      displayOrder: input.displayOrder ?? current.displayOrder
    });
    if (!saved) {
      throw new Error("Field process step not found.");
    }
    return saved;
  }
}

export async function seedMissingSteps(steps: IFieldProcessRepository) {
  await Promise.all(defaultFieldProcessSteps.map((step) => steps.upsertByStepKey(step)));
}

type FieldProcessStepInput = {
  phase?: string;
  copy?: string;
  displayOrder?: number;
};

function toFallbackStep(step: Omit<FieldProcessStep, "id" | "createdAt" | "updatedAt">): FieldProcessStep {
  const createdAt = new Date("2026-09-12T00:00:00.000Z");
  return {
    ...step,
    id: step.stepKey,
    createdAt,
    updatedAt: createdAt
  };
}

function required(value: string | undefined, label: string) {
  const cleaned = value?.trim();
  if (!cleaned) {
    throw new Error(`${label} is required.`);
  }
  return cleaned;
}
