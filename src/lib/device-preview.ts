/** CSS-only touch simulation for uploaded HTML; never alters the saved/downloaded template. */
export function foldablePreviewHtml(html: string): string {
  return html.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi, (_, open: string, css: string, close: string) =>
    open + css.replace(/\(\s*pointer\s*:\s*(coarse|fine)\s*\)/gi, (_, pointer: string) =>
      pointer.toLowerCase() === "coarse" ? "(min-width: 0px)" : "(max-width: 0px)",
    ) + close,
  );
}