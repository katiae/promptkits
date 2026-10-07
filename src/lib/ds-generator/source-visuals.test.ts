import { describe, expect, it } from "vitest";
import { extractSourceVisuals, sourceVisualCss } from "./source-visuals";

describe("template visual extraction", () => {
  it("keeps vector motion while removing executable and remote content", () => {
    const v = extractSourceVisuals(`<html><style>:root{--ink:#234}.card{border:2px solid var(--ink)}.float{animation:float 2s infinite;background:url(https://evil.test/x)}@keyframes float{to{transform:translateY(4px)}}@import url(https://evil.test/style);</style><article class="card"><h3>Example</h3><svg viewBox="0 0 10 10" onload="alert(1)"><script>alert(1)</script><foreignObject><img src="https://evil.test/x"/></foreignObject><path class="float" d="M0 0L5 5"/></svg></article></html>`);
    expect(v.cards[0]?.html).not.toMatch(/script|foreignObject|onload|evil\.test/i);
    expect(v.css).not.toContain("evil.test");
    expect(v.css).toContain(".template-source .float");
    expect(v.css).toContain("animation:source-float");
    expect(v.css).toContain("@keyframes source-float");
    expect(sourceVisualCss(v)).toContain("prefers-reduced-motion");
  });
  it("retains labels, state and local SVG references", () => {
    const v = extractSourceVisuals(`<button class="item" aria-pressed="false"><span>Drink water</span><svg><defs><clipPath id="clip"><rect width="10" height="10"/></clipPath></defs><path clip-path="url(#clip)" d="M0 0"/></svg></button>`);
    expect(v.tasks).toContain('aria-pressed="false"');
    expect(v.tasks).toContain("Drink water");
    expect(v.tasks).toContain("url(#visual-");
  });
});