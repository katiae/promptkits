import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getBundle, availableSlugs } from "./design-system.server";

const slugInput = (d: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(d);

/** Public: which templates have a design system (no content). */
export const listDesignSystems = createServerFn({ method: "GET" }).handler(async () => await availableSlugs());

/** Signed-in only: the guidelines page HTML. */
export const getDesignSystemGuidelines = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(slugInput)
  .handler(async ({ data }) => {
    const b = await getBundle(data.slug);
    return { html: b?.["index.html"] ?? null };
  });

/** Signed-in only: every file in the design system package. */
export const getDesignSystemFiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(slugInput)
  .handler(async ({ data }) => ({ files: await getBundle(data.slug) }));
