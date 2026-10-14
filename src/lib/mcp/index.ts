import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchTemplates from "./tools/search-templates";
import getTemplatePrompt from "./tools/get-template-prompt";
import listSavedTemplates from "./tools/list-saved-templates";

// Vite inlines the stable ref; the published SUPABASE_URL may be a proxy.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "promptkits",
  title: "Promptkits",
  version: "0.1.0",
  instructions: "Browse Promptkits interface templates, read their detailed build prompts to recreate them, and list your saved templates.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchTemplates, getTemplatePrompt, listSavedTemplates],
});
