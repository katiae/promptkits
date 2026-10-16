/** Lovable "Build with URL": opens a new Lovable project with the prompt prefilled (user still clicks Send). */
export const LOVABLE_PROMPT_LIMIT = 50_000;
/** Lovable accepts 50k, but its editor freezes ("Page Unresponsive") on very long prefilled prompts; stay well below. */
export const LOVABLE_SAFE_PROMPT_LIMIT = 20_000;

export function lovableBuildUrl(prompt: string, demoUrl?: string | null): string | null {
  if (!prompt.trim() || prompt.length > LOVABLE_SAFE_PROMPT_LIMIT) return null;
  let url = `https://lovable.dev/#prompt=${encodeURIComponent(prompt)}`;
  if (demoUrl && /^https:\/\//.test(demoUrl)) url += `&html=${encodeURIComponent(demoUrl)}`;
  return url;
}

export type LovablePlan =
  | { kind: "url"; url: string }
  | { kind: "url+clipboard"; url: string; clipboard: string }
  | { kind: "clipboard"; clipboard: string };

/** Full prompt in the link when it fits; otherwise the template in the link and the design system on the clipboard; else everything on the clipboard. */
export function planLovableOpen(templatePrompt: string, dsSection: string): LovablePlan {
  const full = lovableBuildUrl(templatePrompt + dsSection);
  if (full) return { kind: "url", url: full };
  const base = dsSection
    ? lovableBuildUrl(templatePrompt + "\n\nI'll paste this template's design system in my next message. Build with it once I do.")
    : null;
  if (base) return { kind: "url+clipboard", url: base, clipboard: dsSection.trim() };
  return { kind: "clipboard", clipboard: templatePrompt + dsSection };
}
