import { describe, expect, it } from "vitest";
import { withTheme, supportsPreviewThemes } from "./ds-theme";

describe("preview theme bridge", () => {
  it("does not offer invented themes for single-theme templates", () => {
    expect(supportsPreviewThemes('<style>body{background:white}</style>')).toBe(false);
    expect(supportsPreviewThemes('<style>html[data-theme=dark]{background:black}</style>')).toBe(true);
  });
  it("preserves existing template defaults when no theme is selected", () => {
    const result = withTheme('<html data-theme="dark"><body></body></html>');
    expect(result).toContain('<html data-theme="dark">');
  });
  it("sets the requested initial theme even with single-quoted attributes", () => {
    expect(withTheme("<html data-theme='dark'><body></body></html>", "light")).toContain('<html data-theme="light">');
  });
  it("injects executable code without interpreting replacement-string dollar sequences", () => {
    const result = withTheme('<html><body></body></html>', 'dark');
    const script = result.match(/<script data-preview-theme-bridge>([\s\S]*?)<\/script>/)?.[1];
    expect(script).toBeDefined();
    expect(() => new Function(script ?? '')).not.toThrow();
    expect(script).not.toContain('</html>');
  });
});