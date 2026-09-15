import { describe, expect, it } from "vitest";
import { defaultNewsSectionCopy, GetSectionCopyUseCase, heroStatSectionCopies, UpdateSectionCopyUseCase } from "@/server/application/sectionCopyUseCases";
import type { SectionCopy } from "@/server/domain/entities";
import type { ISectionCopyRepository } from "@/server/domain/repositories";

class FakeSectionCopyRepository implements ISectionCopyRepository {
  records = new Map<string, SectionCopy>();

  async findBySectionKey(sectionKey: string) {
    return this.records.get(sectionKey) ?? null;
  }

  async upsert(copy: Omit<SectionCopy, "id" | "updatedAt">) {
    const record = {
      ...copy,
      id: copy.sectionKey,
      updatedAt: new Date()
    };
    this.records.set(copy.sectionKey, record);
    return record;
  }
}

describe("section copy use cases", () => {
  it("returns the default news copy when no record exists", async () => {
    const copy = await new GetSectionCopyUseCase(new FakeSectionCopyRepository()).execute(defaultNewsSectionCopy.sectionKey);

    expect(copy.title).toBe("Updates, milestones, and field notes.");
    expect(copy.ctaHref).toBe("/news");
    expect(copy.visible).toBe(true);
    expect(copy.maxItems).toBe(8);
  });

  it("updates editable homepage news copy", async () => {
    const repo = new FakeSectionCopyRepository();
    const copy = await new UpdateSectionCopyUseCase(repo).execute({
      sectionKey: defaultNewsSectionCopy.sectionKey,
      eyebrow: "Updates",
      title: "Company milestones",
      body: "Published records appear here.",
      ctaLabel: "Read News",
      ctaHref: "/news",
      visible: false,
      theme: "green",
      animationDirection: "left",
      animationSeconds: 34,
      maxItems: 5
    });

    expect(copy.title).toBe("Company milestones");
    expect(copy.visible).toBe(false);
    expect(copy.animationDirection).toBe("left");
    expect(await repo.findBySectionKey(defaultNewsSectionCopy.sectionKey)).toMatchObject({ eyebrow: "Updates" });
  });

  it("updates hero stat card copy", async () => {
    const repo = new FakeSectionCopyRepository();
    const stat = heroStatSectionCopies[0];
    const copy = await new UpdateSectionCopyUseCase(repo).execute({
      sectionKey: stat.sectionKey,
      title: "2025",
      body: "Field deployment year",
      visible: false
    });

    expect(copy.title).toBe("2025");
    expect(copy.body).toBe("Field deployment year");
    expect(copy.visible).toBe(false);
  });
});
