import { describe, it, expect, vi } from "vitest";

const insert = vi.fn(() => Promise.resolve({}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ insert }) } }));

import { summarize, summarizeUsers, track, markOwnerBrowser } from "./analytics";

describe("owner exclusion", () => {
  it("stops recording events once the owner's email signs in on this browser", () => {
    localStorage.clear();
    markOwnerBrowser("someone@else.com");
    track("a", "copy_prompt");
    expect(insert).toHaveBeenCalledTimes(1);
    markOwnerBrowser("Hello@KatiaDeJuan.com");
    track("a", "copy_prompt");
    expect(insert).toHaveBeenCalledTimes(1);
  });
});

describe("summarize", () => {
  it("counts views, copies, tabs and both download kinds per template", () => {
    const s = summarize([
      { entry_slug: "a", event_type: "view" },
      { entry_slug: "a", event_type: "copy_prompt" },
      { entry_slug: "a", event_type: "download_html" },
      { entry_slug: "a", event_type: "download_design_system" },
      { entry_slug: "a", event_type: "open_demo_tab" },
      { entry_slug: "a", event_type: "open_design_system_tab" },
      { entry_slug: "b", event_type: "view" },
      { entry_slug: "user:1", event_type: "sign_in" },
    ]);
    expect(s["a"]).toEqual({ views: 1, copies: 1, downloads: 2, demoTabs: 1, dsTabs: 1, dsDownloads: 1 });
    expect(s["b"]?.views).toBe(1);
    expect(s["user:1"]).toBeUndefined();
  });

  it("counts distinct signed-in users and total sign-ins", () => {
    const u = summarizeUsers([
      { entry_slug: "user:1", event_type: "sign_in" },
      { entry_slug: "user:1", event_type: "sign_in" },
      { entry_slug: "user:2", event_type: "sign_in" },
    ]);
    expect(u).toEqual({ users: 2, signIns: 3 });
  });
});
