/** CSS-only touch simulation for uploaded HTML; never alters the saved/downloaded template. */
export function foldablePreviewHtml(html: string): string {
  return html.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi, (_, open: string, css: string, close: string) =>
    open + css.replace(/\(\s*pointer\s*:\s*(coarse|fine)\s*\)/gi, (_, pointer: string) =>
      pointer.toLowerCase() === "coarse" ? "(min-width: 0px)" : "(max-width: 0px)",
    ) + close,
  );
}
/** Templates that should open in dark mode instead of following the visitor's system setting. */
const DARK_BY_DEFAULT = new Set(["halyard"]);

/** Starts listed templates in dark mode; their own theme switch still works. */
export function defaultThemeHtml(slug: string, html: string): string {
  if (!DARK_BY_DEFAULT.has(slug.toLowerCase())) return html;
  if (/<html[^>]*data-theme=/i.test(html)) return html;
  if (/<html[^>]*>/i.test(html)) return html.replace(/<html/i, '<html data-theme="dark"');
  return `<html data-theme="dark">${html}`;
}
