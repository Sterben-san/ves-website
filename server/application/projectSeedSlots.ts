import type { Project } from "@/server/domain/entities";

export const draftProjectSlotCount = 20;

export function createDraftProjectSlot(index: number, displayOrder: number): Omit<Project, "id" | "createdAt" | "updatedAt"> {
  return {
    title: "",
    slug: `draft-project-slot-${index}`,
    summary: "",
    body: "",
    displayOrder,
    featured: false,
    published: false
  };
}
