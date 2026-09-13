import { getFieldProcessStepsForAdmin } from "@/lib/content";
import type { FieldProcessStep } from "@/server/domain/entities";
import { FieldProcessDashboardClient, type AdminFieldProcessStep } from "./FieldProcessDashboardClient";

export const dynamic = "force-dynamic";

export default async function FieldProcessDashboardPage() {
  const steps = await getFieldProcessStepsForAdmin();

  return (
    <div>
      <div className="border-b border-slate-200 pb-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-ves-leaf">Field Process</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Journey step editor</h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-500">
          Edit the five step boxes shown in the homepage Field Process section. Changes update the public journey after refresh.
        </p>
      </div>
      <FieldProcessDashboardClient initialSteps={steps.map(serializeStep)} />
    </div>
  );
}

function serializeStep(step: FieldProcessStep): AdminFieldProcessStep {
  return {
    ...step,
    createdAt: step.createdAt.toISOString(),
    updatedAt: step.updatedAt.toISOString()
  };
}
