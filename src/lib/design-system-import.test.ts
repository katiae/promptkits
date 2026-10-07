import { describe, it, expect } from "vitest";
import { zipSync, strToU8, strFromU8 } from "fflate";
import { inspectDesignSystemZip, buildImportedGuidelines } from "./design-system-import";

describe("design-system ZIP import", () => {
  it("retains developer files and builds guidelines from their contents", () => {
    const zip = zipSync({ "claude/tokens.css": strToU8(":root{--primary:#227755}"), "claude/Button.tsx": strToU8('export function Button(){return <button>Continue</button>}'), "claude/README.md": strToU8("# Kit\nOriginal documentation"), "claude/logo.png": new Uint8Array([137, 80, 78, 71]) });
    const result = inspectDesignSystemZip(zip);
    expect(result.report.ok).toBe(true);
    expect(strFromU8(result.files["claude/README.md"] ?? new Uint8Array())).toContain("Original documentation");
    expect(result.files["claude/logo.png"]).toEqual(new Uint8Array([137, 80, 78, 71]));
    const guide = buildImportedGuidelines("Sprig", result.files);
    expect(guide).toContain("#227755");
    expect(guide).toContain("claude/Button.tsx");
    expect(guide).toContain("Original documentation");
  });
  it.each([
    ["../unsafe.md", "hello"], ["test.exe", "binary"], [".env", "PRIVATE=secret"],
    ["package.json", '{"scripts":{"postinstall":"node setup.js"}}'],
    ["index.html", '<html><script>eval("evil")</script></html>'],
    ["token.txt", "-----BEGIN PRIVATE KEY-----"],
  ])("blocks unsafe archive content %s", (path, content) => {
    expect(inspectDesignSystemZip(zipSync({ [path]: strToU8(content) })).report.ok).toBe(false);
  });
  it("does not execute uploaded scripts or remote preview resources", () => {
    const guide = buildImportedGuidelines("Kit", { "index.html": strToU8('<html><style>body{color:#227755}</style><body><button onclick="alert(1)">Hello</button><script>evil()</script><img src="https://evil.example/a"></body></html>') });
    expect(guide).not.toContain("evil()");
    expect(guide).not.toContain("onclick");
    expect(guide).not.toContain("https://evil.example");
    expect(guide).toContain('sandbox=""');
  });
});