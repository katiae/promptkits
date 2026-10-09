import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const HTML_SYSTEM = `You are a world-class front-end designer. From a short brief and inspiration material, design and build an original, distinctive website/app template as ONE complete, self-contained HTML file.
Rules:
- Output ONLY the HTML document, starting with <!doctype html>. No markdown fences, no commentary.
- Inline all CSS in <style> and all JS in <script>. Only load external resources from fonts.googleapis.com / fonts.gstatic.com (and optionally cdn.jsdelivr.net or unpkg.com).
- No forms posting anywhere, no fetch/XHR, no tracking, no eval, no external images: draw illustrations and icons with inline SVG or CSS.
- Use inspiration images/notes for mood, palette, type, layout and motion ideas — never copy brands, logos, names or text from them, and never link to source websites.
- Expand the brief into a rich, complete page: several well-crafted sections, a clear visual identity, considered typography, polished spacing, responsive for desktop, tablet and phone, tasteful motion with prefers-reduced-motion support. Include a working light/dark toggle when it suits the template.
- Use realistic placeholder copy and an invented product name.`;

const PROMPT_SYSTEM = `You write build prompts for an interface-template gallery. Given a finished HTML template, write the prompt a developer would paste into an AI builder to recreate it exactly — to the pixel.
Output plain text (markdown headings allowed) with exactly these four sections:
## Overview — product, purpose, audience, personality.
## Layout & structure — every section in order, its grid/columns, content, components and responsive behaviour.
## Styling — exact fonts (families, weights, sizes), exact hex colours with roles for each theme, radii, borders, shadows, spacing scale, icon/illustration style.
## Animations & transitions — every animation and interaction with durations, easings, triggers and reduced-motion behaviour.
Be specific and exhaustive, using the actual values from the code. Never mention inspiration, source websites or that it was generated.`;

const imageSchema = z.string().regex(/^data:image\/(png|jpe?g|webp|gif);base64,/).max(3_000_000);

async function streamText(input: unknown[], effort: "low" | "medium") {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": process.env["LOVABLE_API_KEY"]!, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({ model: "openai/gpt-6-astra", stream: true, store: false, reasoning: { effort }, input }),
  });
  if (!res.ok || !res.body) {
    let msg = "";
    try { const j = await res.json(); msg = j?.error?.message ?? j?.message ?? ""; } catch { /* ignore */ }
    if (res.status === 402) throw new Error("Out of AI credits — add more in Settings → Plans & credits.");
    if (res.status === 429) throw new Error("Too many AI requests right now — try again in a minute.");
    if (res.status === 403) throw new Error(msg || "AI access is blocked for this workspace.");
    throw new Error(`The AI service failed (${res.status}).`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", out = "", refused = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const p = line.slice(5).trim();
      if (!p || p === "[DONE]") continue;
      let evt: any;
      try { evt = JSON.parse(p); } catch { continue; }
      if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") out += evt.delta;
      else if (evt.type === "response.refusal.delta") refused = true;
      else if (evt.type === "response.failed" || evt.type === "error") throw new Error(evt.response?.error?.message ?? evt.message ?? "The AI request failed.");
    }
  }
  if (refused) throw new Error("The AI declined this request.");
  return out.trim();
}

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

/** Step 1: brief + inspiration (notes, links as text, images) → template HTML. */
export const generateTemplateHtml = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ brief: z.string().min(10).max(12000), notes: z.string().max(8000).default(""), images: z.array(imageSchema).max(4).default([]) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const content: unknown[] = [{ type: "input_text", text: `BRIEF:\n${data.brief}\n\nINSPIRATION NOTES & REFERENCES:\n${data.notes || "(none)"}${data.images.length ? `\n\n${data.images.length} inspiration image(s) attached.` : ""}` }];
    for (const url of data.images) content.push({ type: "input_image", image_url: url });
    const out = await streamText([{ role: "system", content: HTML_SYSTEM }, { role: "user", content }], "medium");
    const html = out.replace(/^\s*```(?:html)?\s*/i, "").replace(/```\s*$/, "").trim();
    if (!/<html|<!doctype/i.test(html)) throw new Error("The AI didn't return a usable page. Try again.");
    return { html };
  });

/** Step 2: finished HTML → exhaustive four-section build prompt. */
export const generateBuildPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ html: z.string().min(100).max(400_000) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const prompt = await streamText([{ role: "system", content: PROMPT_SYSTEM }, { role: "user", content: data.html.slice(0, 120_000) }], "low");
    if (prompt.length < 200) throw new Error("The AI returned an incomplete prompt. Try again.");
    return { prompt };
  });
