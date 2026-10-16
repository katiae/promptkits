import { supabase } from "@/integrations/supabase/client";

export type AnalyticsEvent =
  | "view"
  | "copy_prompt"
  | "download_html"
  | "download_design_system"
  | "open_demo_tab"
  | "open_design_system_tab"
  | "sign_in";

/** Prefix used for site-wide sign-in events; the rest of the slug is the user id. */
export const USER_PREFIX = "user:";

const OWNER_EMAIL = "hello@katiadejuan.com";
const EXCLUDE_KEY = "pk-exclude-analytics";

/** Marks this browser as the owner's so none of its activity is counted, even when signed out later. */
export function markOwnerBrowser(email?: string | null) {
  if (typeof window === "undefined" || email?.toLowerCase() !== OWNER_EMAIL) return;
  try { localStorage.setItem(EXCLUDE_KEY, "1"); } catch { /* ignore */ }
}

function isExcluded() {
  try { return localStorage.getItem(EXCLUDE_KEY) === "1"; } catch { return false; }
}

/** Fire-and-forget, anonymous event. Views count once per template per browser session. */
export function track(slug: string, event: AnalyticsEvent) {
  if (typeof window === "undefined" || !slug || isExcluded()) return;
  if (event === "view") {
    const key = `pk-viewed:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch { /* storage unavailable — still count */ }
  }
  void supabase.from("analytics_events").insert({ entry_slug: slug, event_type: event }).then(() => {}, () => {});
}

/** Records a sign-in once per user per browser session. */
export function trackSignIn(userId: string) {
  if (typeof window === "undefined" || !userId) return;
  const key = `pk-signed-in:${userId}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch { /* still count */ }
  track(`${USER_PREFIX}${userId}`, "sign_in");
}

export type EntryStats = { views: number; copies: number; downloads: number; demoTabs: number; dsTabs: number; dsDownloads: number };

export function summarize(rows: { entry_slug: string; event_type: string }[]) {
  const out: Record<string, EntryStats> = {};
  for (const r of rows) {
    if (r.event_type === "sign_in") continue;
    const s = (out[r.entry_slug] ??= { views: 0, copies: 0, downloads: 0, demoTabs: 0, dsTabs: 0, dsDownloads: 0 });
    if (r.event_type === "view") s.views++;
    else if (r.event_type === "copy_prompt") s.copies++;
    else if (r.event_type === "open_demo_tab") s.demoTabs++;
    else if (r.event_type === "open_design_system_tab") s.dsTabs++;
    else if (r.event_type.startsWith("download")) {
      s.downloads++;
      if (r.event_type === "download_design_system") s.dsDownloads++;
    }
  }
  return out;
}

export function summarizeUsers(rows: { entry_slug: string; event_type: string }[]) {
  const users = new Set<string>();
  let signIns = 0;
  for (const r of rows) {
    if (r.event_type !== "sign_in") continue;
    signIns++;
    users.add(r.entry_slug);
  }
  return { users: users.size, signIns };
}
