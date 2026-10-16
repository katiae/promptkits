/** Hand-written intros for category and tag pages, so each page has real, indexable copy. */
export type CollectionIntro = { heading: string; intro: string; description: string };

const nice = (slug: string) => slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const CATEGORIES: Record<string, Omit<CollectionIntro, "description"> & { description?: string }> = {
  "landing-page": {
    heading: "Landing page templates",
    intro: "Landing pages that look made by a designer, not a default AI layout. Each one comes with a live demo and the full build prompt, so you can recreate it in Lovable or any AI builder and make it yours.",
  },
  saas: {
    heading: "SaaS website templates",
    intro: "Marketing sites and product pages for software, with real structure: feature sections, pricing, product shots and motion. Copy the prompt to build one with AI, then grow it into a full design system.",
  },
  portfolio: {
    heading: "Portfolio templates",
    intro: "Personal sites with character, for designers, developers and makers who want to stand out. Try the live demo, copy the full prompt and build your own version with AI in minutes.",
  },
  cybersecurity: {
    heading: "Cybersecurity website templates",
    intro: "Security and developer-tool sites that feel trustworthy and technical without looking generic. Every template includes the complete prompt to rebuild it with AI, plus design-system files.",
  },
};

const TAGS: Record<string, string> = {
  "dark-mode": "Templates designed for dark mode first, with careful contrast, glow and depth. Many also switch to a light theme in the preview.",
  pastel: "Soft, pastel interfaces with calm colour and gentle motion. Copy the prompt to give your AI-built product a warmer, friendlier look.",
  playful: "Playful templates with personality: bold colour, illustrations and interactions that make people smile, built from a single prompt.",
  colour: "Colour-led templates that use bold, confident palettes instead of the usual grey and purple AI defaults.",
  animated: "Templates with considered motion: entrance animations, transitions and hover details described step by step in each prompt.",
  interactive: "Interactive templates that invite people to click, drag and explore, with every behaviour written into the build prompt.",
  minimal: "Minimal templates with clear type, generous space and restraint, proof that simple doesn't have to look generic.",
  modern: "Modern, polished templates with current layout and type trends, ready to rebuild with AI.",
  saas: "Templates for software products: feature sections, pricing, dashboards and product storytelling, each with a full AI build prompt.",
  "product-marketing": "Product marketing pages that explain, persuade and convert, with prompts that capture both layout and tone.",
  "landing-page": "Single landing pages built to make a strong first impression, each with a live demo and a complete prompt.",
  cybersecurity: "Templates for security products that balance technical credibility with a distinctive look.",
};

export function categoryIntro(slug: string): CollectionIntro {
  const c = CATEGORIES[slug];
  const name = nice(slug);
  const heading = c?.heading ?? `${name} templates`;
  const intro = c?.intro ?? `${name} interface templates with live demos and complete AI build prompts. Copy a prompt, open it in Lovable or any AI builder, and make it yours.`;
  return { heading, intro, description: c?.description ?? intro };
}

export function tagIntro(slug: string): CollectionIntro {
  const name = nice(slug);
  const intro = TAGS[slug] ?? `Interface templates tagged ${name.toLowerCase()}, each with a live demo and a full AI build prompt you can copy or open in Lovable.`;
  return { heading: `${name} templates`, intro, description: intro };
}
