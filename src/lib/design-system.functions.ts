import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getBundle, availableSlugs } from "./design-system.server";
import { IMPORT_META } from "./design-system-import";

const slugInput = (d: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(d);

/** Public: which templates have a design system (no content). */
export const listDesignSystems = createServerFn({ method: "GET" }).handler(async () => await availableSlugs());

/** Signed-in only: the guidelines page HTML. */
export const getDesignSystemGuidelines = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(slugInput)
  .handler(async ({ data }) => {
    const b = await getBundle(data.slug);
    const imported = b?.[IMPORT_META];
    if (!imported) return { html: b?.["index.html"] ?? null };
    // Use the uploaded guidelines' own index.html as-is (shallowest one wins), locked down with a CSP.
    const index = Object.keys(b!).filter((p) => /^guidelines-source\/(?:[^/]+\/)?index\.html?$/i.test(p)).sort((a, z) => a.length - z.length)[0];
    if (index) return { html: lockDown(b![index]!) };
    return { html: JSON.parse(imported).guidelines as string };
  });

/** Signed-in only: every file in the design system package. */
export const getDesignSystemFiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(slugInput)
  .handler(async ({ data }) => ({ files: await getBundle(data.slug) }));

const CSP = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src data: https://fonts.gstatic.com; img-src data: blob:; media-src data: blob:; connect-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'">`;
function lockDown(html: string) {
  return /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + CSP) : CSP + html;
}
