// Design-system "brief" the AI returns. Code renders every file from this, so output stays complete and consistent.
export const COMPONENT_GROUPS: { group: string; items: string[] }[] = [
  { group: "Navigation & controls", items: ["SegmentedControl", "Tabs", "CommandMenu", "Pill"] },
  { group: "Forms & inputs", items: ["Button", "TextField", "Select", "Checkbox", "Radio", "Switch", "DatePicker"] },
  { group: "Feedback & status", items: ["StatusIcon", "PriorityIcon", "ProgressBar"] },
  { group: "Data & content", items: ["Card", "Table", "Tag", "Avatar", "Kbd", "Accordion"] },
  { group: "Motion & patterns", items: ["Reveal", "Marquee"] },
];
export const COMPONENTS = COMPONENT_GROUPS.flatMap((g) => g.items);

export const THEME_KEYS = ["bg", "bgRaise", "bgCard", "line", "lineStrong", "fg", "fg2", "fg3", "accent", "accentFg", "accentSoft", "ok", "info", "warn", "danger", "action", "actionFg", "highlight", "highlightFg", "stroke", "pastel1", "pastel2", "pastel3"] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];
export type Theme = Record<ThemeKey, string>;
export type ComponentNote = { name: string; summary: string; usage: string; dos: string[]; donts: string[] };
export const PATTERN_KINDS = ["checklist", "timer", "progress", "plan", "notification", "stat"] as const;
export type ProductPattern = { name: string; kind: (typeof PATTERN_KINDS)[number]; summary: string; usage: string; title: string; items: string[] };
export type Appearance = { buttonRadius: number; controlRadius: number; checkRadius: number; borderWidth: number; controlHeight: number; buttonHeight: number; fontSize: number; fontWeight: number; controlSize: number; shadowOffset: number; accordionCards: boolean };
export type Spec = {
  brand: { name: string; prefix: string; tagline: string; voice: string; overview: string };
  fonts: { display: string; body: string; mono: string; googleHref: string };
  dark: Theme;
  light: Theme;
  radius: { sm: number; md: number; lg: number };
  space: number;
  motion: { fast: number; base: number; slow: number; ease: string };
  components: ComponentNote[];
  appearance: Appearance;
  product: { purpose: string; pages: string[]; patterns: ProductPattern[] };
};

const str = { type: "string" } as const;
const theme = { type: "object", properties: Object.fromEntries(THEME_KEYS.map((k) => [k, str])), required: [...THEME_KEYS], additionalProperties: false };
const num = { type: "number" } as const;

export const SPEC_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["brand", "fonts", "dark", "light", "radius", "space", "motion", "components", "appearance", "product"],
  properties: {
    brand: { type: "object", additionalProperties: false, required: ["name", "prefix", "tagline", "voice", "overview"], properties: { name: str, prefix: str, tagline: str, voice: str, overview: str } },
    fonts: { type: "object", additionalProperties: false, required: ["display", "body", "mono", "googleHref"], properties: { display: str, body: str, mono: str, googleHref: str } },
    dark: theme,
    light: theme,
    radius: { type: "object", additionalProperties: false, required: ["sm", "md", "lg"], properties: { sm: num, md: num, lg: num } },
    space: num,
    appearance: { type: "object", additionalProperties: false, required: ["buttonRadius", "controlRadius", "checkRadius", "borderWidth", "controlHeight", "buttonHeight", "fontSize", "fontWeight", "controlSize", "shadowOffset", "accordionCards"], properties: { buttonRadius: num, controlRadius: num, checkRadius: num, borderWidth: num, controlHeight: num, buttonHeight: num, fontSize: num, fontWeight: num, controlSize: num, shadowOffset: num, accordionCards: { type: "boolean" } } },
    product: { type: "object", additionalProperties: false, required: ["purpose", "pages", "patterns"], properties: { purpose: str, pages: { type: "array", items: str }, patterns: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "kind", "summary", "usage", "title", "items"], properties: { name: str, kind: str, summary: str, usage: str, title: str, items: { type: "array", items: str } } } } } },
    motion: { type: "object", additionalProperties: false, required: ["fast", "base", "slow", "ease"], properties: { fast: num, base: num, slow: num, ease: str } },
    components: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["name", "summary", "usage", "dos", "donts"], properties: { name: str, summary: str, usage: str, dos: { type: "array", items: str }, donts: { type: "array", items: str } } },
    },
  },
};

const DARK: Theme = { bg: "#0b0c0e", bgRaise: "#121316", bgCard: "#15171b", line: "rgba(255,255,255,.08)", lineStrong: "rgba(255,255,255,.14)", fg: "#eceef2", fg2: "#a3a7b0", fg3: "#6b707a", accent: "#f2b66d", accentFg: "#0b0c0e", accentSoft: "rgba(242,182,109,.15)", ok: "#6fcf97", info: "#7aa2f7", warn: "#f2c94c", danger: "#f07178", action: "#f2b66d", actionFg: "#0b0c0e", highlight: "#f2b66d", highlightFg: "#0b0c0e", stroke: "rgba(255,255,255,.14)", pastel1: "#15171b", pastel2: "#121316", pastel3: "#15171b" };
const LIGHT: Theme = { bg: "#f7f7f8", bgRaise: "#ffffff", bgCard: "#ffffff", line: "rgba(12,14,18,.08)", lineStrong: "rgba(12,14,18,.15)", fg: "#16181d", fg2: "#50555f", fg3: "#80858f", accent: "#b8711a", accentFg: "#ffffff", accentSoft: "rgba(184,113,26,.12)", ok: "#1f8a50", info: "#2f5fd0", warn: "#a77a00", danger: "#c4343d", action: "#b8711a", actionFg: "#ffffff", highlight: "#b8711a", highlightFg: "#ffffff", stroke: "rgba(12,14,18,.15)", pastel1: "#ffffff", pastel2: "#f7f7f8", pastel3: "#ffffff" };

const COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\))$/i;
const clean = (s: unknown, max: number, fb: string) => (typeof s === "string" && s.trim() ? s.replace(/[<>`]/g, "").trim().slice(0, max) : fb);
const clamp = (n: unknown, lo: number, hi: number, fb: number) => (typeof n === "number" && isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : fb);
const fontName = (s: unknown, fb: string) => clean(s, 40, fb).replace(/[^\w\s-]/g, "") || fb;

/** Validates and clamps whatever the model returned into a safe, complete spec. */
export function normalizeSpec(raw: any, fallbackName: string): Spec {
  const fixTheme = (t: any, d: Theme): Theme => Object.fromEntries(THEME_KEYS.map((k) => [k, typeof t?.[k] === "string" && COLOR.test(t[k].trim()) ? t[k].trim() : ({ action: t?.accent, actionFg: t?.accentFg, highlight: t?.accent, highlightFg: t?.accentFg, stroke: t?.lineStrong, pastel1: t?.bgCard, pastel2: t?.bgRaise, pastel3: t?.bgCard } as Record<string, string>)[k] && COLOR.test(({ action: t?.accent, actionFg: t?.accentFg, highlight: t?.accent, highlightFg: t?.accentFg, stroke: t?.lineStrong, pastel1: t?.bgCard, pastel2: t?.bgRaise, pastel3: t?.bgCard } as Record<string, string>)[k]) ? ({ action: t?.accent, actionFg: t?.accentFg, highlight: t?.accent, highlightFg: t?.accentFg, stroke: t?.lineStrong, pastel1: t?.bgCard, pastel2: t?.bgRaise, pastel3: t?.bgCard } as Record<string, string>)[k] : d[k]])) as Theme;
  const prefix = (typeof raw?.brand?.prefix === "string" ? raw.brand.prefix.toLowerCase().replace(/[^a-z]/g, "") : "").slice(0, 4);
  const href = typeof raw?.fonts?.googleHref === "string" && raw.fonts.googleHref.startsWith("https://fonts.googleapis.com/") ? raw.fonts.googleHref.replace(/["<>]/g, "") : "";
  const notes = new Map<string, ComponentNote>();
  for (const c of Array.isArray(raw?.components) ? raw.components : []) {
    if (COMPONENTS.includes(c?.name)) notes.set(c.name, {
      name: c.name, summary: clean(c.summary, 160, ""), usage: clean(c.usage, 400, ""),
      dos: (Array.isArray(c.dos) ? c.dos : []).slice(0, 4).map((x: unknown) => clean(x, 140, "")).filter(Boolean),
      donts: (Array.isArray(c.donts) ? c.donts : []).slice(0, 4).map((x: unknown) => clean(x, 140, "")).filter(Boolean),
    });
  }
  return {
    brand: {
      name: clean(raw?.brand?.name, 40, fallbackName),
      prefix: prefix.length >= 2 ? prefix : "ds",
      tagline: clean(raw?.brand?.tagline, 120, "A complete interface kit."),
      voice: clean(raw?.brand?.voice, 300, "Clear, calm and direct."),
      overview: clean(raw?.brand?.overview, 600, ""),
    },
    fonts: { display: fontName(raw?.fonts?.display, "Inter Tight"), body: fontName(raw?.fonts?.body, "Inter"), mono: fontName(raw?.fonts?.mono, "JetBrains Mono"), googleHref: href },
    dark: fixTheme(raw?.dark, DARK),
    light: fixTheme(raw?.light, LIGHT),
    radius: { sm: clamp(raw?.radius?.sm, 0, 16, 6), md: clamp(raw?.radius?.md, 0, 24, 10), lg: clamp(raw?.radius?.lg, 0, 40, 16) },
    space: clamp(raw?.space, 2, 8, 4),
    motion: { fast: clamp(raw?.motion?.fast, 60, 300, 120), base: clamp(raw?.motion?.base, 120, 500, 200), slow: clamp(raw?.motion?.slow, 200, 1200, 420), ease: /^cubic-bezier\([\d\s.,-]+\)$|^ease(-in|-out|-in-out)?$/.test(raw?.motion?.ease ?? "") ? raw.motion.ease : "cubic-bezier(0.32,0.72,0,1)" },
    appearance: {
      buttonRadius: clamp(raw?.appearance?.buttonRadius, 0, 999, raw?.radius?.md ?? 10),
      controlRadius: clamp(raw?.appearance?.controlRadius, 0, 999, raw?.radius?.md ?? 10),
      checkRadius: clamp(raw?.appearance?.checkRadius, 0, 999, raw?.radius?.sm ?? 6),
      borderWidth: clamp(raw?.appearance?.borderWidth, 1, 4, 1),
      controlHeight: clamp(raw?.appearance?.controlHeight, 32, 64, 34),
      buttonHeight: clamp(raw?.appearance?.buttonHeight, 32, 64, 32),
      fontSize: clamp(raw?.appearance?.fontSize, 12, 18, 13),
      fontWeight: clamp(raw?.appearance?.fontWeight, 400, 800, 500),
      controlSize: clamp(raw?.appearance?.controlSize, 16, 32, 16),
      shadowOffset: clamp(raw?.appearance?.shadowOffset, 0, 8, 0),
      accordionCards: raw?.appearance?.accordionCards === true,
    },
    product: {
      purpose: clean(raw?.product?.purpose, 400, ""),
      pages: (Array.isArray(raw?.product?.pages) ? raw.product.pages : []).slice(0, 12).map((x: unknown) => clean(x, 100, "")).filter(Boolean),
      patterns: (Array.isArray(raw?.product?.patterns) ? raw.product.patterns : []).filter((x: any) => PATTERN_KINDS.includes(x?.kind)).slice(0, 6).map((x: any, i: number) => ({ name: clean(x.name, 60, `Pattern ${i + 1}`), kind: x.kind, summary: clean(x.summary, 200, ""), usage: clean(x.usage, 400, ""), title: clean(x.title, 100, ""), items: (Array.isArray(x.items) ? x.items : []).slice(0, 5).map((v: unknown) => clean(v, 100, "")).filter(Boolean) })),
    },
    components: COMPONENTS.map((n) => notes.get(n) ?? { name: n, summary: "", usage: "", dos: [], donts: [] }),
  };
}
