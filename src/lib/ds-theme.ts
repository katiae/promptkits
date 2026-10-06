export type DsTheme = "dark" | "light";
/** Sets the starting theme of a design-system guidelines page. */
export const withTheme = (html: string, theme: DsTheme) =>
  html.replace(/<html([^>]*?)data-theme="[^"]*"/, `<html$1data-theme="${theme}"`);
/** Switches the theme of a loaded guidelines iframe without reloading it (keeps scroll position). */
export const postTheme = (frame: HTMLIFrameElement | null, theme: DsTheme) =>
  frame?.contentWindow?.postMessage({ type: "hy-theme", theme }, "*");
