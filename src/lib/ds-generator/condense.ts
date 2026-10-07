/** Shrinks a template's HTML into a compact style summary for the model. */
export function condenseHtml(html: string): string {
  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n").replace(/\s+/g, " ");
  const links = [...html.matchAll(/<link[^>]+href="([^"]*fonts[^"]*)"/gi)].map((m) => m[1]);
  const freq = new Map<string, number>();
  for (const m of html.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\([^)]+\)/g)) { const c = m[0].toLowerCase(); freq.set(c, (freq.get(c) ?? 0) + 1); };
  const colors = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([c, n]) => `${c} ×${n}`);
  const fonts = [...new Set([...html.matchAll(/font-family\s*:\s*([^;}"]+)/gi)].map((m) => (m[1] ?? "").trim()))].slice(0, 10);
  const tw = [...new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap((m) => (m[1] ?? "").split(/\s+/)))].slice(0, 300).join(" ");
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const rules = styles.split("}").filter((r) => /(?:btn|button|check|radio|switch|toggle|faq|accordion|habit|plan|breathe|input|select|:root|data-mode|data-theme)/i.test(r)).map((r) => r + "}");
  const headings = [...html.matchAll(/<(h[1-4])[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) => m[2].replace(/<[^>]+>/g, " ").trim());
  const pages = [...html.matchAll(/<(?:section|main|form|article)[^>]*(?:id|class)=["']([^"']+)["'][^>]*>/gi)].map((m) => m[1]);
  return [
    `FONT LINKS: ${links.join(" | ") || "none"}`,
    `FONT FAMILIES: ${fonts.join(" | ") || "none"}`,
    `TOP COLOURS: ${colors.join(", ")}`,
    `CONTROLS AND PRODUCT CSS (preserve exact treatments): ${rules.join("\n").slice(0, 18000)}`,
    `PAGE SECTIONS: ${pages.join(" | ").slice(0, 2500)}`,
    `HEADINGS THROUGHOUT THE TEMPLATE: ${headings.join(" | ").slice(0, 5000)}`,
    `CSS (truncated): ${styles.slice(0, 14000)}`,
    `CLASS NAMES SAMPLE: ${tw.slice(0, 3000)}`,
    `VISIBLE TEXT SAMPLE: ${text.slice(0, 3500) + " … " + text.slice(-3500)}`,
  ].join("\n\n");
}
