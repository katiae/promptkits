import { describe, expect, it } from "vitest";
import { foldablePreviewHtml } from "./device-preview";

describe("foldable preview touch media", () => {
  it("simulates touch while preserving width and aspect-ratio conditions", () => {
    const html = '<style>@media (pointer: coarse) and (min-width: 600px) and (max-aspect-ratio: 5/4){.nav{display:flex}}</style>';
    expect(foldablePreviewHtml(html)).toBe(html.replace("(pointer: coarse)", "(min-width: 0px)"));
  });
  it("disables fine-pointer styles and leaves scripts and content intact", () => {
    const html = '<STYLE>@media (pointer: fine){a{display:block}}</STYLE><script>const query="(pointer: coarse)";</script><p>(pointer: coarse)</p>';
    expect(foldablePreviewHtml(html)).toBe(html.replace("(pointer: fine)", "(max-width: 0px)"));
  });
  it("leaves templates without pointer media queries unchanged", () => {
    const html = '<style>@media (max-width: 900px){nav{display:none}}</style>';
    expect(foldablePreviewHtml(html)).toBe(html);
  });
});