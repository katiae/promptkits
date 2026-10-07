import { condenseHtml } from "./condense";
import { COMPONENT_GROUPS, SPEC_JSON_SCHEMA, normalizeSpec, type Spec } from "./spec";

export class GatewayError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const SYSTEM = `You are a senior design-systems designer. From a website/app template's styles and build prompt, write the design brief for a complete, production-grade design system that extends the template's aesthetic DNA (palette, type, shape, motion) to a full product UI kit.
Rules:
- brand.name: the template's product name if it has one, else an evocative 1-2 word name. brand.prefix: 2-3 lowercase letters derived from the name (used as CSS variable prefix). tagline: one sentence. voice: 1-2 sentences on tone of UI copy. overview: 2-3 sentences describing the visual language.
- fonts: use the template's real font families (Google Fonts names). googleHref: a https://fonts.googleapis.com/css2 URL loading all three with needed weights.
- dark and light: provide BOTH themes as hex or rgba values. Keep the template's own theme faithful; derive the other so it feels like the same brand. accent must keep AA contrast against bg in each theme (darken it for light themes). accentFg is text on the accent. accentSoft is a translucent accent tint. line/lineStrong are dividers, NOT structural outlines. stroke is the real structural outline colour. action/actionFg are the actual primary CTA pair; accent is the brand colour and may be different. highlight/highlightFg capture secondary highlighted actions or selected toggles (e.g. yellow wellness CTA versus green brand). pastel1/2/3 preserve supporting panel colours. Do NOT darken a yellow CTA that already has dark readable text just to make the background meet text contrast. Preserve existing local pastel panel treatments.
- appearance: infer actual desktop control geometry from the CSS, not a generic SaaS kit. Include buttonRadius (999 for pills), controlRadius, checkRadius (999 for circular habit checkboxes), borderWidth, controlHeight, buttonHeight, fontSize, fontWeight, controlSize, shadowOffset (solid vertical offset shadow, zero if none), accordionCards (true for separate rounded outlined FAQ items). Match playful thick strokes and tactile shadows when present; do not make a friendly consumer template look like an enterprise dashboard.
- product: identify its purpose and ALL supplied page/section workflows from HTML, headings and prompt. pages lists those sections. patterns: 3-5 genuinely relevant reusable compositions beyond primitives, choosing a supported kind: checklist, timer, progress, plan, notification, stat. Each has a descriptive component name, kind, summary, usage, title, and 2-4 realistic short example items. A wellness template needs habit checklists, breathing sessions, reminders and progress; commerce needs plans and product stats. Only describe pages visible in the supplied material, never claim to inspect external pages. Do not invent medical claims, testimonials or actual business prices.
- radius in px (sm < md < lg), space = base spacing unit in px (usually 4), motion durations in ms and an ease (cubic-bezier).
- components: one entry for EACH of: ${COMPONENT_GROUPS.flatMap((g) => g.items).join(", ")}. summary: one sentence of what it is. usage: when to use it in this brand's style. dos/donts: 2-3 short items each.`;

/** Asks the AI gateway for a design brief and returns a normalized spec. */
export async function generateSpec(input: { name: string; prompt: string; html: string }, apiKey: string): Promise<Spec> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "medium", summary: "auto" },
      include: ["reasoning.encrypted_content"],
      input: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `TEMPLATE NAME: ${input.name}\n\nBUILD PROMPT:\n${input.prompt.slice(0, 6000)}\n\nTEMPLATE STYLES:\n${input.html ? condenseHtml(input.html) : "(no HTML uploaded)"}` },
      ],
      text: { format: { type: "json_schema", name: "design_system_brief", strict: true, schema: SPEC_JSON_SCHEMA } },
    }),
  });
  if (!res.ok || !res.body) {
    let msg = "";
    try { const j = await res.json(); msg = j?.error?.message ?? j?.message ?? ""; } catch { /* ignore */ }
    const friendly =
      res.status === 402 ? "Out of AI credits — add more in Settings → Plans & credits." :
      res.status === 429 ? "Too many AI requests right now — try again in a minute." :
      res.status === 403 ? msg || "AI access is blocked for this workspace." :
      `The AI service failed (${res.status}).`;
    throw new GatewayError(res.status, friendly);
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
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload);
        if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") out += evt.delta;
        else if (evt.type === "response.refusal.delta") refused = true;
        else if (evt.type === "response.failed" || evt.type === "error") throw new GatewayError(500, evt.response?.error?.message ?? evt.message ?? "The AI request failed.");
      } catch (e) { if (e instanceof GatewayError) throw e; }
    }
  }
  if (refused) throw new GatewayError(200, "The AI declined to generate this design system.");
  if (!out) throw new GatewayError(500, "The AI returned nothing.");
  let raw: unknown;
  try { raw = JSON.parse(out); } catch { throw new GatewayError(500, "The AI returned an unreadable answer."); }
  return normalizeSpec(raw, input.name);
}
