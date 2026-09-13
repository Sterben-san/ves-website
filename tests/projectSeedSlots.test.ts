import { describe, expect, it } from "vitest";
import { createDraftProjectSlot, draftProjectSlotCount } from "@/server/application/projectSeedSlots";

describe("project seed slots", () => {
  it("keeps twenty blank admin-only project placeholders", () => {
    const slots = Array.from({ length: draftProjectSlotCount }, (_, index) => createDraftProjectSlot(index + 1, index + 5));

    expect(slots).toHaveLength(20);
    expect(slots[0]).toMatchObject({
      title: "",
      slug: "draft-project-slot-1",
      summary: "",
      featured: false,
      published: false
    });
    expect(slots[19].slug).toBe("draft-project-slot-20");
  });
});
