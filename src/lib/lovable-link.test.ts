import { describe, it, expect } from "vitest";
import { lovableBuildUrl } from "./lovable-link";

describe("lovableBuildUrl", () => {
  it("prefills an encoded prompt and the demo reference", () => {
    expect(lovableBuildUrl("Build a todo app", "https://promptkits.dev/sites/a/live-demo")).toBe(
      "https://lovable.dev/#prompt=Build%20a%20todo%20app&html=https%3A%2F%2Fpromptkits.dev%2Fsites%2Fa%2Flive-demo",
    );
  });
  it("returns null above Lovable's 50,000 character limit", () => {
    expect(lovableBuildUrl("x".repeat(50_001))).toBeNull();
  });
});
