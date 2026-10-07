// Template identity on a continuous spectrum. Halyard (calm/precise) and Sprig (warm/playful) are anchors, not categories.
export const TRANSITIONS = ["blind-wipe", "circle-reveal", "radial-bloom", "diagonal-sweep", "soft-crossfade", "iris-soft"] as const;
export type TransitionKind = (typeof TRANSITIONS)[number];
export type Identity = {
  summary: string;
  descriptors: string[];
  playfulness: number;
  warmth: number;
  expressiveness: number;
  density: number;
  anchorNote: string;
  imagery: string;
  motionCharacter: string;
  themeNames: { dark: string; light: string; meaning: string };
  transition: { kind: TransitionKind; duration: number; ease: string; rationale: string };
};

const str = { type: "string" } as const;
const num = { type: "number" } as const;
export const IDENTITY_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["summary", "descriptors", "playfulness", "warmth", "expressiveness", "density", "anchorNote", "imagery", "motionCharacter", "themeNames", "transition"],
  properties: {
    summary: str, descriptors: { type: "array", items: str }, playfulness: num, warmth: num, expressiveness: num, density: num,
    anchorNote: str, imagery: str, motionCharacter: str,
    themeNames: { type: "object", additionalProperties: false, required: ["dark", "light", "meaning"], properties: { dark: str, light: str, meaning: str } },
    transition: { type: "object", additionalProperties: false, required: ["kind", "duration", "ease", "rationale"], properties: { kind: { type: "string", enum: [...TRANSITIONS] }, duration: num, ease: str, rationale: str } },
  },
};

export const IDENTITY_PROMPT = `IDENTITY (identity field) — treat personality as a SPECTRUM, never a binary:
- Halyard (calm, precise, technical) and Sprig (warm, playful, illustrated) are two reference anchors. Most templates sit somewhere between or outside them (editorial, luxurious, brutalist, crafty, retro, clinical-but-friendly...). Never force a template into one anchor.
- Score 0-100: playfulness (0 restrained/serious, 100 joyful/whimsical), warmth (0 cool/neutral, 100 warm/human), expressiveness (0 quiet/minimal, 100 bold/loud), density (0 airy, 100 compact/information-dense). Base scores on real evidence in the CSS/HTML (radii, stroke weights, shadows, palette saturation, copy tone, illustrations, motion curves).
- summary: one precise sentence of what it feels like. descriptors: 3-5 specific adjectives. anchorNote: one sentence on how it relates to the anchors (e.g. "Halyard's precision with Sprig's softer palette, no bounce").
- imagery: the illustration/graphic style this system should use, derived from the template (may blend abstract line graphics and flat illustration, or be photographic/typographic).
- motionCharacter: one sentence on curves, durations and whether bounce fits. Bounce only for clearly playful templates; mid-spectrum gets gentle, natural easing.
- themeNames: names for the two themes that fit the product (Dark/Light for tools, Day/Night or something meaningful otherwise) and what each is for.
- transition: choose the theme-switch transition that matches the blend: blind-wipe (calm/precise), circle-reveal (playful, grows from the switch), radial-bloom (soft circle with feathered edge — mid-spectrum warmth), diagonal-sweep (editorial, directional), soft-crossfade (quiet, luxurious, minimal), iris-soft (friendly but restrained). duration 400-1000ms, ease cubic-bezier matching motionCharacter, rationale one sentence.`;

const clean = (s: unknown, max: number, fb: string) => (typeof s === "string" && s.trim() ? s.replace(/[<>`]/g, "").trim().slice(0, max) : fb);
const score = (n: unknown) => (typeof n === "number" && isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 50);
const EASE = /^cubic-bezier\([\d\s.,-]+\)$|^ease(-in|-out|-in-out)?$|^linear$/;

export function normalizeIdentity(raw: any): Identity {
  const playfulness = score(raw?.playfulness);
  const kind: TransitionKind = TRANSITIONS.includes(raw?.transition?.kind) ? raw.transition.kind : playfulness > 66 ? "circle-reveal" : playfulness < 34 ? "blind-wipe" : "radial-bloom";
  return {
    summary: clean(raw?.summary, 240, ""),
    descriptors: (Array.isArray(raw?.descriptors) ? raw.descriptors : []).slice(0, 6).map((x: unknown) => clean(x, 30, "")).filter(Boolean),
    playfulness, warmth: score(raw?.warmth), expressiveness: score(raw?.expressiveness), density: score(raw?.density),
    anchorNote: clean(raw?.anchorNote, 240, ""),
    imagery: clean(raw?.imagery, 300, ""),
    motionCharacter: clean(raw?.motionCharacter, 300, ""),
    themeNames: { dark: clean(raw?.themeNames?.dark, 20, "Dark"), light: clean(raw?.themeNames?.light, 20, "Light"), meaning: clean(raw?.themeNames?.meaning, 240, "") },
    transition: {
      kind,
      duration: typeof raw?.transition?.duration === "number" ? Math.min(1000, Math.max(400, Math.round(raw.transition.duration))) : 700,
      ease: EASE.test(raw?.transition?.ease ?? "") ? raw.transition.ease : "cubic-bezier(0.65,0,0.35,1)",
      rationale: clean(raw?.transition?.rationale, 240, ""),
    },
  };
}

/** View Transitions CSS for the chosen theme switch, scoped under html.<px>-theme-vt. */
export function transitionCss(id: Identity, p: string) {
  const { kind, duration: d, ease } = id.transition;
  const scope = `html.${p}-theme-vt`;
  const base = `${scope}::view-transition-old(root), ${scope}::view-transition-new(root) { animation:none; mix-blend-mode:normal; }\n${scope} * { view-transition-name:none !important; }\n`;
  const body: Record<TransitionKind, string> = {
    "blind-wipe": `${scope}::view-transition-new(root) { -webkit-mask:linear-gradient(#000 48%, transparent 52%) 0 100% / 100% 250%; mask:linear-gradient(#000 48%, transparent 52%) 0 100% / 100% 250%; animation:${p}-wipe ${d}ms ${ease} forwards; }\n@keyframes ${p}-wipe { to { -webkit-mask-position:0 0; mask-position:0 0; } }`,
    "circle-reveal": `${scope}::view-transition-new(root) { animation:${p}-circle ${d}ms ${ease} forwards; }\n@keyframes ${p}-circle { from { clip-path:circle(0 at var(--${p}-vt-x,50%) var(--${p}-vt-y,50%)); } to { clip-path:circle(150% at var(--${p}-vt-x,50%) var(--${p}-vt-y,50%)); } }`,
    "radial-bloom": `${scope}::view-transition-new(root) { -webkit-mask:radial-gradient(circle at var(--${p}-vt-x,50%) var(--${p}-vt-y,50%), #000 40%, transparent 60%) center / 0% 0% no-repeat; mask:radial-gradient(circle at var(--${p}-vt-x,50%) var(--${p}-vt-y,50%), #000 40%, transparent 60%) center / 0% 0% no-repeat; animation:${p}-bloom ${d}ms ${ease} forwards; }\n@keyframes ${p}-bloom { to { -webkit-mask-size:350% 350%; mask-size:350% 350%; } }`,
    "diagonal-sweep": `${scope}::view-transition-new(root) { -webkit-mask:linear-gradient(120deg, #000 45%, transparent 55%) 100% 0 / 300% 100%; mask:linear-gradient(120deg, #000 45%, transparent 55%) 100% 0 / 300% 100%; animation:${p}-sweep ${d}ms ${ease} forwards; }\n@keyframes ${p}-sweep { to { -webkit-mask-position:0 0; mask-position:0 0; } }`,
    "soft-crossfade": `${scope}::view-transition-old(root) { animation:${p}-fade-out ${d}ms ${ease} forwards; }\n${scope}::view-transition-new(root) { animation:${p}-fade-in ${d}ms ${ease} forwards; }\n@keyframes ${p}-fade-out { to { opacity:0; } }\n@keyframes ${p}-fade-in { from { opacity:0; } }`,
    "iris-soft": `${scope}::view-transition-new(root) { animation:${p}-iris ${d}ms ${ease} forwards; }\n@keyframes ${p}-iris { from { clip-path:inset(50% 50% 50% 50% round 40%); opacity:.6; } to { clip-path:inset(0 0 0 0 round 0); opacity:1; } }`,
  };
  return `/* Theme transition: ${kind} — ${id.transition.rationale || "matched to the template's identity"} */\n@media (prefers-reduced-motion: no-preference) {\n${base}${body[kind]}\n}\n`;
}

export const transitionJs = (p: string) => `// Wrap theme changes so the matching transition plays. Falls back to an instant switch.
export function switchTheme(next, event) {
  const root = document.documentElement;
  const apply = () => root.setAttribute("data-theme", next);
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return apply();
  if (event) { root.style.setProperty("--${p}-vt-x", event.clientX + "px"); root.style.setProperty("--${p}-vt-y", event.clientY + "px"); }
  root.classList.add("${p}-theme-vt");
  document.startViewTransition(apply).finished.finally(() => root.classList.remove("${p}-theme-vt"));
}
`;

const bar = (label: string, lo: string, hi: string, v: number, p: string) =>
  `<div style="display:grid;grid-template-columns:120px minmax(0,1fr);gap:12px;align-items:center;margin:8px 0"><span style="font-size:12px;color:var(--${p}-fg-2)">${label}</span><div><div style="position:relative;height:6px;border-radius:99px;background:var(--${p}-line-strong)"><i style="position:absolute;top:50%;left:${v}%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:var(--${p}-accent);box-shadow:0 0 0 3px var(--${p}-bg)"></i></div><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--${p}-fg-3);margin-top:6px"><span>${lo}</span><span>${hi}</span></div></div></div>`;

export function identityHtml(id: Identity, p: string, esc: (s: string) => string) {
  return `<h5 class="eyebrow" style="margin-top:24px">Identity</h5>${id.summary ? `<p>${esc(id.summary)}</p>` : ""}${id.descriptors.length ? `<div class="row" style="gap:6px;flex-wrap:wrap;margin:10px 0">${id.descriptors.map((d) => `<span class="${p}-tag">${esc(d)}</span>`).join("")}</div>` : ""}<div style="max-width:520px;margin-top:14px">${bar("Playfulness", "Calm · precise", "Warm · playful", id.playfulness, p)}${bar("Warmth", "Cool", "Warm", id.warmth, p)}${bar("Expressiveness", "Quiet", "Bold", id.expressiveness, p)}${bar("Density", "Airy", "Compact", id.density, p)}</div>${id.anchorNote ? `<p style="color:var(--${p}-fg-2)">${esc(id.anchorNote)}</p>` : ""}${id.imagery ? `<h5 class="eyebrow" style="margin-top:20px">Imagery</h5><p>${esc(id.imagery)}</p>` : ""}<h5 class="eyebrow" style="margin-top:20px">Themes</h5><p><b>${esc(id.themeNames.dark)}</b> / <b>${esc(id.themeNames.light)}</b>${id.themeNames.meaning ? ` — ${esc(id.themeNames.meaning)}` : ""}</p>`;
}

export function identityMd(id: Identity) {
  return `## Identity\n\n${id.summary}\n\n${id.descriptors.map((d) => `\`${d}\``).join(" ")}\n\n| Scale | 0 | Score | 100 |\n|---|---|---|---|\n| Playfulness | calm, precise | ${id.playfulness} | warm, playful |\n| Warmth | cool | ${id.warmth} | warm |\n| Expressiveness | quiet | ${id.expressiveness} | bold |\n| Density | airy | ${id.density} | compact |\n\n${id.anchorNote}\n\n**Imagery:** ${id.imagery}\n\n**Motion:** ${id.motionCharacter}\n\n**Themes:** ${id.themeNames.dark} / ${id.themeNames.light}. ${id.themeNames.meaning}\n\n**Theme transition:** \`${id.transition.kind}\`, ${id.transition.duration}ms, \`${id.transition.ease}\`. ${id.transition.rationale} See \`dist/theme-transition.css\` and \`dist/theme-transition.js\`.\n`;
}
