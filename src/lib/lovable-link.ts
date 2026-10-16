/** Lovable "Build with URL": opens a new Lovable project with the prompt prefilled (user still clicks Send). */
export const LOVABLE_PROMPT_LIMIT = 50_000;

export function lovableBuildUrl(prompt: string, demoUrl?: string | null): string | null {
  if (!prompt.trim() || prompt.length > LOVABLE_PROMPT_LIMIT) return null;
  let url = `https://lovable.dev/#prompt=${encodeURIComponent(prompt)}`;
  if (demoUrl && /^https:\/\//.test(demoUrl)) url += `&html=${encodeURIComponent(demoUrl)}`;
  return url;
}
