import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_saved_templates",
  title: "List my saved templates",
  description: "List the templates the signed-in user has saved (hearted).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    const sb = supabaseForUser(ctx);
    const { data: favs, error } = await sb.from("favorites").select("entry_id");
    if (error) throw new ToolError("Couldn't load saved templates.");
    const ids = (favs ?? []).map((f) => String(f.entry_id));
    const { data: rows, error: e2 } = ids.length ? await sb.from("entries").select("slug,name,description,category").in("id", ids) : { data: [], error: null };
    if (e2) throw new ToolError("Couldn't load saved templates.");
    const templates = (rows ?? []).map((e) => ({ slug: String(e.slug), name: String(e.name), description: String(e.description), category: String(e.category) }));
    return { content: [{ type: "text", text: JSON.stringify(templates) }], structuredContent: { templates } };
  },
});
