import { createFileRoute } from "@tanstack/react-router";
import { defaultThemeHtml } from "@/lib/device-preview";

export const Route = createFileRoute("/sites/$slug/live-demo")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async ({ params }) => {
        const SUPABASE_URL =
          import.meta.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"];
        const SUPABASE_PUBLISHABLE_KEY =
          import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
          process.env["SUPABASE_PUBLISHABLE_KEY"];

        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Not configured", { status: 500 });
        }

        const slug = encodeURIComponent(params.slug);
        const url =
          `${SUPABASE_URL}/rest/v1/entries` +
          `?slug=eq.${slug}&status=eq.published&select=slug,html_content,demo_url`;

        const res = await fetch(url, {
          headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
        });
        if (!res.ok) return new Response("Upstream error", { status: 502 });

        const rows = (await res.json()) as Array<{
          slug: string;
          html_content: string | null;
          demo_url: string | null;
        }>;
        const entry = rows[0];
        if (!entry) return new Response("Not found", { status: 404 });

        if (entry.html_content) {
          // `sandbox` CSP keeps the template in an opaque origin even though the
          // URL is same-origin, so it cannot read app storage or cookies.
          return new Response(defaultThemeHtml(entry.slug, entry.html_content), {
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Content-Security-Policy":
                "sandbox allow-scripts allow-forms allow-popups",
              "Cache-Control": "public, max-age=300",
            },
          });
        }

        if (entry.demo_url) {
          return new Response(null, {
            status: 302,
            headers: { Location: entry.demo_url },
          });
        }

        return new Response("Not found", { status: 404 });
      },
    },
  },
});
