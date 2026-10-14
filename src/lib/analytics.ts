import { supabase } from "@/integrations/supabase/client";

export type AnalyticsEvent = "view" | "copy_prompt" | "download_html" | "download_design_system";

/** Fire-and-forget, anonymous event. Views count once per template per browser session. */
export function track(slug: string, event: AnalyticsEvent) {
  if (typeof window === "undefined" || !slug) return;
  if (event === "view") {
    const key = `pk-viewed:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch { /* storage unavailable — still count */ }
  }
  void supabase.from("analytics_events").insert({ entry_slug: slug, event_type: event }).then(() => {}, () => {});
}

export type EntryStats = { views: number; copies: number; downloads: number };

export function summarize(rows: { entry_slug: string; event_type: string }[]) {
  const out: Record<string, EntryStats> = {};
  for (const r of rows) {
    const s = (out[r.entry_slug] ??= { views: 0, copies: 0, downloads: 0 });
    if (r.event_type === "view") s.views++;
    else if (r.event_type === "copy_prompt") s.copies++;
    else if (r.event_type.startsWith("download")) s.downloads++;
  }
  return out;
}
