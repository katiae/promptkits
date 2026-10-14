import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_template_prompt",
  title: "Get template build prompt",
  description: "Return a published template's full build prompt so an assistant can recreate it.",
  inputSchema: { slug: z.string().trim().min(1).max(120).describe("Template slug from search_templates.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }, ctx) => {
    const { data, error } = await supabaseForUser(ctx).from("entries").select("slug,name,description,category,tags,prompt").eq("slug", slug).eq("status", "published").maybeSingle();
    if (error) throw new ToolError("Couldn't load the template.");
    if (!data) throw new ToolError(`No published template with slug "${slug}".`);
    const template = { slug: data.slug, name: data.name, description: data.description, category: data.category, tags: [...data.tags], prompt: data.prompt };
    return { content: [{ type: "text", text: `# ${data.name}\n\n${data.prompt}` }], structuredContent: { template } };
  },
});
