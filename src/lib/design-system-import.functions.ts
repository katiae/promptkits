import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GUIDES = "guidelines-source/";
const b64 = z.string().max(14_000_000).regex(/^[A-Za-z0-9+/]*={0,2}$/, "Invalid ZIP data.");

export const importDesignSystem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ entryId: z.string().uuid(), zipBase64: b64.optional(), guidesBase64: b64.optional() })
    .refine((d) => d.zipBase64 || d.guidesBase64, "Choose at least one ZIP.").parse(input))
  .handler(async ({ data, context }) => {
    const { data: allowed, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !allowed) throw new Error("Forbidden");
    const { inspectDesignSystemZip, buildImportedGuidelines, IMPORT_META } = await import("./design-system-import");
    const { strFromU8, strToU8 } = await import("fflate");
    const decode = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    const scan = (s?: string) => (s ? inspectDesignSystemZip(decode(s)) : null);
    const kit = scan(data.zipBase64), guides = scan(data.guidesBase64);
    for (const r of [kit, guides]) if (r && !r.report.ok) return { ok: false as const, report: r.report };
    for (const r of [kit, guides]) if (r && Object.keys(r.files).some((p) => p === IMPORT_META)) throw new Error("Package contains a reserved file name.");

    const { data: entry, error } = await context.supabase.from("entries").select("id,slug,name").eq("id", data.entryId).single();
    if (error || !entry) throw new Error("Template not found.");
    const { data: current } = await context.supabase.from("design_systems").select("status,files").eq("entry_id", entry.id).maybeSingle();
    if (current?.status === "generating") throw new Error("Wait for the current generation to finish before uploading.");

    // Keep the half that wasn't re-uploaded from a previous import.
    const prev = (current?.files ?? {}) as Record<string, string>;
    const prevMeta = prev[IMPORT_META] ? JSON.parse(prev[IMPORT_META]) : null;
    const files: Record<string, string> = {};
    const binaryPaths: string[] = [];
    const isBin = (p: string) => /\.(png|jpe?g|webp|gif|ico|woff2?|ttf|otf)$/i.test(p);
    const add = (path: string, content: Uint8Array) => {
      if (isBin(path)) {
        binaryPaths.push(path);
        let v = "";
        for (let i = 0; i < content.length; i += 8192) v += String.fromCharCode(...content.subarray(i, i + 8192));
        files[path] = btoa(v);
      } else files[path] = strFromU8(content);
    };
    if (prevMeta) for (const [p, c] of Object.entries(prev)) {
      if (p === IMPORT_META) continue;
      const isGuide = p.startsWith(GUIDES);
      if ((isGuide && !guides) || (!isGuide && !kit)) { files[p] = c; if (prevMeta.binaryPaths?.includes(p)) binaryPaths.push(p); }
    }
    if (kit) for (const [p, c] of Object.entries(kit.files)) add(p, c);
    if (guides) for (const [p, c] of Object.entries(guides.files)) add(GUIDES + p, c);

    // Guidelines page: guidelines ZIP if present, else the kit.
    const guideSource: Record<string, Uint8Array> = {};
    const hasGuides = Object.keys(files).some((p) => p.startsWith(GUIDES));
    for (const [p, c] of Object.entries(files)) {
      if (hasGuides !== p.startsWith(GUIDES)) continue;
      guideSource[hasGuides ? p.slice(GUIDES.length) : p] = binaryPaths.includes(p) ? decode(c) : strToU8(c);
    }
    const guidelines = buildImportedGuidelines(entry.name, guideSource);
    const report = { ...(kit ?? guides)!.report, findings: [...(kit?.report.findings ?? []), ...(guides?.report.findings ?? [])] };
    files[IMPORT_META] = JSON.stringify({ version: 2, binaryPaths, guidelines, report });
    const { error: writeError } = await context.supabase.from("design_systems").upsert({ entry_id: entry.id, slug: entry.slug, status: "ready", spec: null, files, error: null, updated_at: new Date().toISOString() }, { onConflict: "entry_id" });
    if (writeError) throw new Error("Couldn't save the design system. Please try again.");
    return { ok: true as const, report };
  });
