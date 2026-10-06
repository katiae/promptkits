// Design system bundles. Hand-built packages live in the repo; AI-generated ones live in the database.
const files = import.meta.glob("/src/design-systems/**/*", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

export function getBundledFiles(slug: string): Record<string, string> | null {
  const prefix = `/src/design-systems/${slug}/`;
  const out: Record<string, string> = {};
  for (const [path, content] of Object.entries(files)) {
    if (path.startsWith(prefix)) out[path.slice(prefix.length)] = content;
  }
  return Object.keys(out).length ? out : null;
}

export function bundledSlugs(): string[] {
  return [...new Set(Object.keys(files).map((p) => p.split("/")[3] ?? ""))].filter(Boolean);
}

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

/** Repo bundle first, then a ready generated package for a published template. */
export async function getBundle(slug: string): Promise<Record<string, string> | null> {
  const bundled = getBundledFiles(slug);
  if (bundled) return bundled;
  const sb = await admin();
  const { data: entry } = await sb.from("entries").select("id").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!entry) return null;
  const { data } = await sb.from("design_systems").select("files").eq("entry_id", entry.id).eq("status", "ready").maybeSingle();
  return (data?.files as Record<string, string> | null) ?? null;
}

export async function availableSlugs(): Promise<string[]> {
  const sb = await admin();
  const { data } = await sb.from("design_systems").select("entries!inner(slug, status)").eq("status", "ready");
  const generated = (data ?? []).map((r: any) => r.entries).filter((e: any) => e?.status === "published").map((e: any) => e.slug as string);
  return [...new Set([...bundledSlugs(), ...generated])];
}
