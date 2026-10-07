export type DsTheme = "dark" | "light";
/** Sets the starting theme of a design-system guidelines page. */
export const withTheme = (html: string, theme: DsTheme) =>
  /<html[^>]*data-theme="[^"]*"/i.test(html)
    ? html.replace(/<html([^>]*?)data-theme="[^"]*"/i, `<html$1data-theme="${theme}"`)
    : html.replace(/<html/i, `<html data-theme="${theme}"`);
/** Switches the theme of a loaded guidelines iframe without reloading it (keeps scroll position). */
export const postTheme = (frame: HTMLIFrameElement | null, theme: DsTheme) =>
  frame?.contentWindow?.postMessage({ type: "hy-theme", theme }, "*");
