import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SYSTEM = `You are a world-class front-end designer. Build the described website/app template as ONE complete, self-contained HTML file.
Rules:
- Output ONLY the HTML document, starting with <!doctype html>. No markdown fences, no commentary.
- Inline all CSS in <style> and all JS in <script>. Only load external resources from fonts.googleapis.com / fonts.gstatic.com (and optionally cdn.jsdelivr.net or unpkg.com).
- No forms posting anywhere, no fetch/XHR, no tracking, no eval, no external images: draw illustrations and icons with inline SVG or CSS.
- Follow the prompt's overview, layout, styling and animations faithfully. Make it distinctive, polished and responsive (desktop, tablet, phone), with tasteful motion and prefers-reduced-motion support. If the prompt mentions light/dark, include a working theme toggle.
- Use realistic placeholder copy; never reference real brands or source websites.`;

export const generateTemplateHtml = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ prompt: z.string().min(20) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": process.env["LOVABLE_API_KEY"]!, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        input: [
          { role: "system", content: SYSTEM },
          { role: "user", content: data.prompt.slice(0, 12000) },
        ],
      }),
    });
    if (!res.ok || !res.body) {
      if (res.status === 402) throw new Error("Out of AI credits — add more in Settings → Plans & credits.");
      if (res.status === 429) throw new Error("Too many AI requests right now — try again in a minute.");
      throw new Error(`The AI service failed (${res.status}).`);
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", out = "";
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
        try {
          const evt = JSON.parse(p);
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") out += evt.delta;
        } catch { /* keep-alive */ }
      }
    }
    const html = out.replace(/^\s*```(?:html)?\s*/i, "").replace(/```\s*$/, "").trim();
    if (!/<html|<!doctype/i.test(html)) throw new Error("The AI didn't return a usable page. Try again.");
    return { html };
  });
