import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_saved_templates",
  title: "List my saved templates",
  description: "List the templates the signed-in user has saved (hearted).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    const { data, error } = await supabaseForUser(ctx).from("favorites").select("entries(slug,name,description,category)");
    if (error) throw new ToolError("Couldn't load saved templates.");
    const templates = (data ?? []).map((r) => r.entries).filter((e): e is NonNullable<typeof e> => !!e).map((e) => ({ slug: e.slug, name: e.name, description: e.description, category: e.category }));
    return { content: [{ type: "text", text: JSON.stringify(templates) }], structuredContent: { templates } };
  },
});
