import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const importDesignSystem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ entryId: z.string().uuid(), zipBase64: z.string().max(6_700_000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: allowed, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !allowed) throw new Error("Forbidden");
    const { inspectDesignSystemZip, buildImportedGuidelines, IMPORT_META } = await import("./design-system-import");
    const { strFromU8 } = await import("fflate");
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(data.zipBase64)) throw new Error("Invalid ZIP data.");
    const bytes = Uint8Array.from(atob(data.zipBase64), (c) => c.charCodeAt(0));
    const result = inspectDesignSystemZip(bytes);
    if (!result.report.ok) return { ok: false as const, report: result.report };
    const { data: entry, error } = await context.supabase.from("entries").select("id,slug,name").eq("id", data.entryId).single();
    if (error || !entry) throw new Error("Template not found.");
    const { data: current } = await context.supabase.from("design_systems").select("status").eq("entry_id", entry.id).maybeSingle();
    if (current?.status === "generating") throw new Error("Wait for the current generation to finish before uploading.");
    if (Object.keys(result.files).some((p) => p === IMPORT_META)) throw new Error("Package contains a reserved file name.");
    const files: Record<string, string> = {};
    const binaryPaths: string[] = [];
    for (const [path, content] of Object.entries(result.files)) {
      if (/\.(png|jpe?g|webp|woff2?|ttf|otf)$/i.test(path)) {
        binaryPaths.push(path);
        let value = "";
        for (let i = 0; i < content.length; i += 8192) value += String.fromCharCode(...content.subarray(i, i + 8192));
        files[path] = btoa(value);
      } else files[path] = strFromU8(content);
    }
    files[IMPORT_META] = JSON.stringify({ version: 1, binaryPaths, guidelines: buildImportedGuidelines(entry.name, result.files), report: result.report });
    const { error: writeError } = await context.supabase.from("design_systems").upsert({ entry_id: entry.id, slug: entry.slug, status: "ready", spec: null, files, error: null, updated_at: new Date().toISOString() }, { onConflict: "entry_id" });
    if (writeError) throw new Error("Couldn't save the design system. Please try again.");
    return { ok: true as const, report: result.report };
  });