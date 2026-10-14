import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_templates",
  title: "Search templates",
  description: "List published interface templates, optionally filtered by text, category or tag.",
  inputSchema: {
    query: z.string().trim().max(100).optional().describe("Words to match in the name or description."),
    category: z.string().trim().max(60).optional().describe("Exact category, e.g. 'Landing page'."),
    tag: z.string().trim().max(60).optional().describe("A single tag to filter by."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, tag, limit }, ctx) => {
    let q = supabaseForUser(ctx).from("entries").select("slug,name,description,category,tags").eq("status", "published").order("sort_order", { ascending: true }).limit(limit ?? 20);
    if (category) q = q.eq("category", category);
    if (tag) q = q.contains("tags", [tag]);
    if (query) { const s = query.replace(/[%,()]/g, " "); q = q.or(`name.ilike.%${s}%,description.ilike.%${s}%`); }
    const { data, error } = await q;
    if (error) throw new ToolError("Couldn't load templates.");
    const templates = (data ?? []).map((e) => ({ slug: e.slug, name: e.name, description: e.description, category: e.category, tags: [...e.tags] }));
    return { content: [{ type: "text", text: JSON.stringify(templates) }], structuredContent: { templates } };
  },
});
