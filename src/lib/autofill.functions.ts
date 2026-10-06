import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type EntryMeta = {
  name: string;
  description: string;
  category: string;
  tags: string[];
  hue: number;
};

export const autofillEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ prompt: z.string().min(20) }).parse(data))
  .handler(async ({ data, context }) => {
    // Only admins may use this
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin");
    if (!roles?.length) throw new Response("Forbidden", { status: 403 });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": process.env["LOVABLE_API_KEY"]!,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        input: [
          {
            role: "system",
            content:
              "You fill in directory metadata for an interface-template gallery. Given a build prompt for a website/app template, return: name (2-3 word evocative template name, no brand names), description (one short sentence, max 90 chars), category (one of: Landing page, Dashboard, App, Marketing, Portfolio, E-commerce, Blog, Other), tags (3-5 lowercase hyphenated tags), hue (integer 0-360 matching the template's dominant colour mood).",
          },
          { role: "user", content: data.prompt.slice(0, 8000) },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "entry_meta",
            strict: true,
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                category: { type: "string" },
                tags: { type: "array", items: { type: "string" } },
                hue: { type: "integer" },
              },
              required: ["name", "description", "category", "tags", "hue"],
              additionalProperties: false,
            },
          },
        },
      }),
    });
    if (!res.ok || !res.body) throw new Error(`AI gateway error: ${res.status}`);

    // Consume the SSE stream and collect the output text
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let output = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
            output += evt.delta;
          } else if (evt.type === "response.completed" && evt.response?.output_text) {
            output = evt.response.output_text;
          }
        } catch {
          /* ignore non-JSON keep-alives */
        }
      }
    }
    if (!output) throw new Error("No suggestion returned");
    return JSON.parse(output) as EntryMeta;
  });
