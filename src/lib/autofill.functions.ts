import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You fill in directory metadata for an interface-template gallery. Given a build prompt for a website/app template, return JSON with: name (2-3 word evocative template name, no brand names), description (one short sentence, max 90 chars), category (one of: Landing page, Dashboard, App, Marketing, Portfolio, E-commerce, Blog, Other), tags (3-5 lowercase hyphenated tags), hue (integer 0-360 matching the template's dominant colour mood).",
          },
          { role: "user", content: data.prompt.slice(0, 8000) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "entry_meta",
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
    if (!res.ok) throw new Error(`AI gateway error: ${res.status}`);
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("No suggestion returned");
    return JSON.parse(content) as {
      name: string; description: string; category: string; tags: string[]; hue: number;
    };
  });
