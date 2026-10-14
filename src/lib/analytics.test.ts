import { describe, it, expect } from "vitest";
import { summarize } from "./analytics";

describe("summarize", () => {
  it("counts views, copies and both download kinds per template", () => {
    const s = summarize([
      { entry_slug: "a", event_type: "view" },
      { entry_slug: "a", event_type: "copy_prompt" },
      { entry_slug: "a", event_type: "download_html" },
      { entry_slug: "a", event_type: "download_design_system" },
      { entry_slug: "b", event_type: "view" },
    ]);
    expect(s["a"]).toEqual({ views: 1, copies: 1, downloads: 2 });
    expect(s["b"]).toEqual({ views: 1, copies: 0, downloads: 0 });
  });
});
