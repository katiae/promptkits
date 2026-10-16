import { describe, it, expect } from "vitest";
import { lovableBuildUrl, planLovableOpen } from "./lovable-link";

describe("lovableBuildUrl", () => {
  it("prefills an encoded prompt", () => {
    expect(lovableBuildUrl("Build a todo app")).toBe("https://lovable.dev/#prompt=Build%20a%20todo%20app");
  });
  it("refuses prompts over 20,000 characters so Lovable doesn't freeze", () => {
    expect(lovableBuildUrl("x".repeat(20_001))).toBeNull();
    expect(lovableBuildUrl("x".repeat(20_000))).not.toBeNull();
  });
});

describe("planLovableOpen", () => {
  it("puts everything in the link when it fits", () => {
    expect(planLovableOpen("a", "b").kind).toBe("url");
  });
  it("keeps the template in the link and copies the design system when too long", () => {
    const p = planLovableOpen("t".repeat(15_000), "d".repeat(10_000));
    expect(p.kind).toBe("url+clipboard");
  });
  it("copies everything when the template alone is too long", () => {
    expect(planLovableOpen("t".repeat(25_000), "").kind).toBe("clipboard");
  });
});
