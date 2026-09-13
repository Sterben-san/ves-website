import { describe, expect, it } from "vitest";
import { shouldSeedInitialTeam } from "@/server/application/seedGuards";

describe("seed guards", () => {
  it("bootstraps the initial team only before the seed marker exists", () => {
    expect(shouldSeedInitialTeam(0, false)).toBe(true);
    expect(shouldSeedInitialTeam(2, false)).toBe(false);
    expect(shouldSeedInitialTeam(0, true)).toBe(false);
  });
});
