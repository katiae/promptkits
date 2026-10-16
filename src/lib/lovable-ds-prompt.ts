/** Builds the design-system part of the "Open in Lovable" prompt from a package's code files. */
const CODE = /\.(css|tsx?|jsx?)$/i;
const SKIP = /(^|\/)(guidelines-source|node_modules|\.storybook)\/|\.stories\.[jt]sx?$|\.test\.[jt]sx?$|\.d\.ts$|^__promptfolio/i;

/** Rank: tokens first, then styles, then components, then everything else. */
function rank(path: string) {
  if (/tokens/i.test(path) && /\.css$/i.test(path)) return 0;
  if (/\.css$/i.test(path)) return 1;
  if (/\.(tsx|jsx)$/i.test(path)) return 2;
  return 3;
}

export function pickDesignSystemFiles(bundle: Record<string, string>): Record<string, string> {
  const paths = Object.keys(bundle).filter((p) => CODE.test(p) && !SKIP.test(p)).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  return Object.fromEntries(paths.map((p) => [p, bundle[p]!]));
}

export function designSystemPromptSection(name: string, files: Record<string, string>): string {
  const paths = Object.keys(files);
  if (!paths.length) return "";
  const blocks = paths.map((p) => `### src/design-system/${p}\n\`\`\`${p.split(".").pop()}\n${files[p]!.trim()}\n\`\`\``).join("\n\n");
  return `\n\n---\n\n## Design system (use these exact files)\n\nThis project uses the ${name} design system. Create every file below at the path shown, copying its contents exactly. Import the CSS files once at the app root, and build every screen from these tokens and components instead of writing new styles or new components. Keep the dark and light themes working.\n\n${blocks}\n`;
}
