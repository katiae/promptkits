import { describe, it, expect } from "vitest";
import { pickDesignSystemFiles, designSystemPromptSection } from "./lovable-ds-prompt";

describe("pickDesignSystemFiles", () => {
  it("keeps tokens, styles and components; drops stories, guidelines, docs and images", () => {
    const picked = pickDesignSystemFiles({
      "react/Components.tsx": "c", "react/Components.stories.tsx": "s", "tokens/tokens.css": "t", "dist/kit.css": "k",
      "index.html": "h", "README.md": "r", "guidelines-source/app.js": "g", "assets/logo.png": "b", "__promptfolio_import.json": "{}",
    });
    expect(Object.keys(picked)).toEqual(["tokens/tokens.css", "dist/kit.css", "react/Components.tsx"]);
  });
  it("adds nothing when there are no code files", () => {
    expect(designSystemPromptSection("Keel", {})).toBe("");
  });
});
