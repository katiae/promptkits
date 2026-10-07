import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const idInput = (d: unknown) => z.object({ entryId: z.string().uuid() }).parse(d);

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

/** Admin: generate (or regenerate) a template's design system with AI. */
export const generateDesignSystem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idInput)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { data: entry, error } = await sb.from("entries").select("id, slug, name, prompt, html_content").eq("id", data.entryId).single();
    if (error || !entry) return { ok: false as const, error: "Template not found." };
    await sb.from("design_systems").upsert({ entry_id: entry.id, slug: entry.slug, status: "generating", error: null, updated_at: new Date().toISOString() }, { onConflict: "entry_id" });
    try {
      const { generateSpec } = await import("./ds-generator/generate.server");
      const { renderPackage } = await import("./ds-generator/render");
      const spec = await generateSpec({ name: entry.name, prompt: entry.prompt ?? "", html: entry.html_content ?? "" }, process.env["LOVABLE_API_KEY"]!);
      const files = renderPackage(spec);
      await sb.from("design_systems").update({ status: "ready", spec, files, error: null, updated_at: new Date().toISOString() }).eq("entry_id", entry.id);
      return { ok: true as const, files: Object.keys(files).length };
    } catch (e) {
      console.error("design system generation failed", e);
      const msg = e instanceof Error && e.message ? e.message : "Generation failed.";
      await sb.from("design_systems").update({ status: "failed", error: msg, updated_at: new Date().toISOString() }).eq("entry_id", entry.id);
      return { ok: false as const, error: msg };
    }
  });

/** Admin: generation status for every template. */
export const listDesignSystemStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    // A run that stopped mid-way (page closed or refreshed) never reports back — mark it as interrupted after 5 minutes.
    const staleBefore = new Date(Date.now() - 5 * 60_000).toISOString();
    await sb.from("design_systems")
      .update({ status: "failed", error: "Interrupted — the page was closed or refreshed. Try again.", updated_at: new Date().toISOString() })
      .eq("status", "generating").lt("updated_at", staleBefore);
    const { data } = await sb.from("design_systems").select("entry_id, status, error, updated_at");
    return (data ?? []) as { entry_id: string; status: string; error: string | null; updated_at: string }[];
  });
