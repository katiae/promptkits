import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const idInput = (d: unknown) => z.object({ entryId: z.string().uuid() }).parse(d);

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

/**
 * Admin: generate (or regenerate) a template's design system with AI.
 * Marks the row "generating" and hands the real work to an internal
 * background route, so the build keeps running even if the admin
 * closes or refreshes the page. Poll listDesignSystemStatus for the result.
 */
export const generateDesignSystem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(idInput)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const sb = context.supabase;
    const { data: entry, error } = await sb.from("entries").select("id, slug").eq("id", data.entryId).single();
    if (error || !entry) return { ok: false as const, error: "Template not found." };
    await sb.from("design_systems").upsert({ entry_id: entry.id, slug: entry.slug, status: "generating", error: null, updated_at: new Date().toISOString() }, { onConflict: "entry_id" });
    // Fire-and-forget: the background route does the AI build and writes the result.
    const { getRequest } = await import("@tanstack/react-start/server");
    const origin = new URL(getRequest().url).origin;
    void fetch(`${origin}/api/public/ds-generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-token": process.env["DS_INTERNAL_TOKEN"]! },
      body: JSON.stringify({ entryId: entry.id }),
    }).catch((e) => console.error("failed to start design system generation", e));
    return { ok: true as const, started: true };
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
