import { createFileRoute } from "@tanstack/react-router";
import { getRouterInstance } from "@tanstack/react-start";
import { slugify } from "@/lib/entries";
import { isSitemapRouteIncluded, sitemapPathForLocation, sitemapStaticPaths, sitemapXML, type SitemapEntry } from "@/lib/sitemap";

const BASE_URL = "https://promptkits.dev";

export const Route = createFileRoute("/sitemap.xml")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async () => {
        const router = await getRouterInstance();
        const entries: SitemapEntry[] = sitemapStaticPaths(router).map((path) => ({ path }));
        const routeId = "/sites/$slug";
        if (isSitemapRouteIncluded(router.routesById[routeId])) {
          const { createClient } = await import("@supabase/supabase-js");
          const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
          const supabase = createClient(process.env["SUPABASE_URL"]!, key, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: {
              fetch: (input, init) => {
                const headers = new Headers(init?.headers);
                if (key.startsWith("sb_") && headers.get("Authorization") === "Bearer " + key) headers.delete("Authorization");
                headers.set("apikey", key);
                return fetch(input, { ...init, headers });
              },
            },
          });
          const categories = new Set<string>();
          const tagCounts = new Map<string, number>();
          const pageSize = 1000;
          for (let offset = 0; ; ) {
            const { data, error } = await supabase.from("entries").select("slug,category,tags").eq("status", "published").order("id").range(offset, offset + pageSize - 1);
            if (error) throw error;
            if (!data || data.length === 0) break;
            for (const row of data) {
              const location = router.buildLocation({ to: "/sites/$slug", params: { slug: row.slug }, search: () => ({}), hash: "" });
              const path = sitemapPathForLocation(router, location, routeId);
              if (path) entries.push({ path });
              if (row.category) categories.add(slugify(row.category));
              for (const t of row.tags ?? []) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
            }
            offset += data.length;
          }
          for (const c of categories) entries.push({ path: `/category/${c}` });
          // Only tags shared by 2+ templates, so thin single-template pages stay out of search.
          for (const [t, n] of tagCounts) if (n >= 2) entries.push({ path: `/tag/${t}` });
        }
        return new Response(sitemapXML(BASE_URL, entries), {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
