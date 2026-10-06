export type DsTheme = "dark" | "light";
/** Sets the starting theme of a design-system guidelines page. */
export const withTheme = (html: string, theme: DsTheme) =>
  html.replace(/<html([^>]*?)data-theme="[^"]*"/, `<html$1data-theme="${theme}"`);
