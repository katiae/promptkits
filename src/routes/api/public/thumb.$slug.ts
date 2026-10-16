import { createFileRoute } from "@tanstack/react-router";

// Serves a published template's stored thumbnail as a real image for link previews.
export const Route = createFileRoute("/api/public/thumb/$slug")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async ({ params }) => {
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
        const { data } = await supabase.from("entries").select("thumbnail_url").eq("slug", params.slug).eq("status", "published").maybeSingle();
        const m = data?.thumbnail_url?.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
        if (!m) return new Response("Not found", { status: 404 });
        const bytes = Uint8Array.from(atob(m[2]!), (c) => c.charCodeAt(0));
        return new Response(bytes, { headers: { "Content-Type": m[1]!, "Cache-Control": "public, max-age=86400" } });
      },
    },
  },
});
