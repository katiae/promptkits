import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Entry = Tables<"entries">;

// Public lists skip heavy columns (full HTML files, scan reports, prompts).
const LIST_COLUMNS =
  "id,slug,name,description,category,tags,demo_url,thumbnail_url,status,hue,created_at";

export const entriesQuery = (full = false) =>
  queryOptions({
    queryKey: ["entries", full ? "full" : "list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select(full ? "*" : LIST_COLUMNS)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Entry[];
    },
  });

export const entryQuery = (slug: string) =>
  queryOptions({
    queryKey: ["entry", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("entries").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data as Entry | null;
    },
  });

// Detail page splits into a light meta fetch (fast first paint) and a heavy
// content fetch (full HTML file + prompt) that streams in after.
export const entryMetaQuery = (slug: string) =>
  queryOptions({
    queryKey: ["entry", slug, "meta"],
    queryFn: async () => {
      const { data, error } = await supabase.from("entries").select(LIST_COLUMNS).eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data as unknown as Entry | null;
    },
  });

export const entryContentQuery = (slug: string) =>
  queryOptions({
    queryKey: ["entry", slug, "content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("id,html_content,prompt,scan_report")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as Pick<Entry, "id" | "html_content" | "prompt" | "scan_report"> | null;
    },
  });

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Normalize a tag list: slugified, trimmed, de-duplicated, empties removed. */
export function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((t) => slugify(t)).filter(Boolean))];
}
