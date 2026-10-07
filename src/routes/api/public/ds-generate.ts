import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Internal background worker for design-system generation.
 * Called fire-and-forget by the generateDesignSystem server function so the
 * build keeps running even if the admin closes the page. Protected by a
 * shared secret header — it is not usable by outside callers.
 */
export const Route = createFileRoute("/api/public/ds-generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env["DS_INTERNAL_TOKEN"];
        if (!token || request.headers.get("x-internal-token") !== token) {
          return new Response("Unauthorized", { status: 401 });
        }
        let entryId: string;
        try {
          entryId = z.object({ entryId: z.string().uuid() }).parse(await request.json()).entryId;
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: entry } = await supabaseAdmin
          .from("entries")
          .select("id, slug, name, prompt, html_content")
          .eq("id", entryId)
          .single();
        if (!entry) return new Response("Not found", { status: 404 });

        try {
          const { generateSpec } = await import("@/lib/ds-generator/generate.server");
          const { renderPackage } = await import("@/lib/ds-generator/render");
          const { extractSourceVisuals } = await import("@/lib/ds-generator/source-visuals");
          const spec = await generateSpec(
            { name: entry.name, prompt: entry.prompt ?? "", html: entry.html_content ?? "" },
            process.env["LOVABLE_API_KEY"]!,
          );
          const files = renderPackage(spec, entry.html_content ? extractSourceVisuals(entry.html_content) : undefined);
          await supabaseAdmin
            .from("design_systems")
            .update({ status: "ready", spec, files, error: null, updated_at: new Date().toISOString() })
            .eq("entry_id", entry.id);
        } catch (e) {
          console.error("design system generation failed", e);
          const msg = e instanceof Error && e.message ? e.message : "Generation failed.";
          await supabaseAdmin
            .from("design_systems")
            .update({ status: "failed", error: msg, updated_at: new Date().toISOString() })
            .eq("entry_id", entry.id);
        }
        return new Response("ok");
      },
    },
  },
});
