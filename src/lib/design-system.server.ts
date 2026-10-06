// Design system bundles, bundled into the server only. Keyed by template slug.
const files = import.meta.glob("/src/design-systems/**/*", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

export function getBundle(slug: string): Record<string, string> | null {
  const prefix = `/src/design-systems/${slug}/`;
  const out: Record<string, string> = {};
  for (const [path, content] of Object.entries(files)) {
    if (path.startsWith(prefix)) out[path.slice(prefix.length)] = content;
  }
  return Object.keys(out).length ? out : null;
}

export function availableSlugs(): string[] {
  return [...new Set(Object.keys(files).map((p) => p.split("/")[3] ?? ""))].filter(Boolean);
}
