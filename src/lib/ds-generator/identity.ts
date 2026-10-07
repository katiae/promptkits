// Template identity on a continuous spectrum. Halyard (calm/precise) and Sprig (warm/playful) are anchors, not categories.
export const TRANSITIONS = ["wipe", "circle-reveal", "radial-bloom", "liquid-blob", "ripple", "soft-crossfade", "blur-dissolve", "iris", "shutter", "grain-dissolve", "slide-push", "ink-spread"] as const;
export type TransitionKind = (typeof TRANSITIONS)[number];
export const ORIGINS = ["switch", "center", "top", "bottom", "left", "right", "top-left", "bottom-right"] as const;
export type Origin = (typeof ORIGINS)[number];
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
  transition: { name: string; kind: TransitionKind; origin: Origin; softness: number; blur: number; duration: number; ease: string; rationale: string };
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
    transition: { type: "object", additionalProperties: false, required: ["name", "kind", "origin", "softness", "blur", "duration", "ease", "rationale"], properties: { name: str, kind: { type: "string", enum: [...TRANSITIONS] }, origin: { type: "string", enum: [...ORIGINS] }, softness: num, blur: num, duration: num, ease: str, rationale: str } },
  },
};

export const IDENTITY_PROMPT = `IDENTITY (identity field) — treat personality as a SPECTRUM, never a binary:
- Halyard (calm, precise, technical) and Sprig (warm, playful, illustrated) are two reference anchors. Most templates sit somewhere between or outside them (editorial, luxurious, brutalist, crafty, retro, clinical-but-friendly...). Never force a template into one anchor.
- Score 0-100: playfulness (0 restrained/serious, 100 joyful/whimsical), warmth (0 cool/neutral, 100 warm/human), expressiveness (0 quiet/minimal, 100 bold/loud), density (0 airy, 100 compact/information-dense). Base scores on real evidence in the CSS/HTML (radii, stroke weights, shadows, palette saturation, copy tone, illustrations, motion curves).
- summary: one precise sentence of what it feels like. descriptors: 3-5 specific adjectives. anchorNote: one sentence on how it relates to the anchors (e.g. "Halyard's precision with Sprig's softer palette, no bounce").
- imagery: the illustration/graphic style this system should use, derived from the template (may blend abstract line graphics and flat illustration, or be photographic/typographic).
- motionCharacter: one sentence on curves, durations and whether bounce fits. Bounce only for clearly playful templates; mid-spectrum gets gentle, natural easing.
- themeNames: names for the two themes that fit the product (Dark/Light for tools, Day/Night or something meaningful otherwise) and what each is for.
- transition: design a theme-switch transition that FEELS like this template's identity — the anchors' wipe and circle are just two examples, not the menu. Compose it from: kind (base movement: wipe, circle-reveal, radial-bloom, liquid-blob (organic wobbling edge, liquid/fluid brands), ripple (concentric rings, water/calm wellness), soft-crossfade, blur-dissolve (dreamy, frosted, atmospheric), iris (rounded aperture, friendly-restrained), shutter (striped blinds, editorial/structured), grain-dissolve (noisy, film/retro/tactile), slide-push (decisive, directional, product-y), ink-spread (feathered irregular bleed, crafty/artistic)), origin (switch = grows from where the person clicked, center, or an edge/corner; for wipes and slides the edge sets direction), softness 0-100 (edge feathering: 0 crisp, 100 very feathered), blur 0-100 (how much the outgoing theme blurs while leaving). duration 300-1400ms; ease cubic-bezier matching motionCharacter (springy overshoot only for genuinely playful templates). name: an evocative 2-4 word name for this specific transition (e.g. "Tide rolling in", "Paper turning", "Lights dimming"). rationale: one sentence linking it to the identity.`;

const clean = (s: unknown, max: number, fb: string) => (typeof s === "string" && s.trim() ? s.replace(/[<>`]/g, "").trim().slice(0, max) : fb);
const score = (n: unknown) => (typeof n === "number" && isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 50);
const EASE = /^cubic-bezier\([\d\s.,-]+\)$|^ease(-in|-out|-in-out)?$|^linear$/;

export function normalizeIdentity(raw: any): Identity {
  const playfulness = score(raw?.playfulness);
  const t = raw?.transition ?? {};
  const legacy: Record<string, TransitionKind> = { "blind-wipe": "wipe", "diagonal-sweep": "wipe", "iris-soft": "iris" };
  const kind: TransitionKind = TRANSITIONS.includes(t.kind) ? t.kind : legacy[t.kind] ?? (playfulness > 66 ? "circle-reveal" : playfulness < 34 ? "wipe" : "radial-bloom");
  const origin: Origin = ORIGINS.includes(t.origin) ? t.origin : t.kind === "diagonal-sweep" ? "top-left" : kind === "wipe" ? "top" : "switch";
  return {
    summary: clean(raw?.summary, 240, ""),
    descriptors: (Array.isArray(raw?.descriptors) ? raw.descriptors : []).slice(0, 6).map((x: unknown) => clean(x, 30, "")).filter(Boolean),
    playfulness, warmth: score(raw?.warmth), expressiveness: score(raw?.expressiveness), density: score(raw?.density),
    anchorNote: clean(raw?.anchorNote, 240, ""),
    imagery: clean(raw?.imagery, 300, ""),
    motionCharacter: clean(raw?.motionCharacter, 300, ""),
    themeNames: { dark: clean(raw?.themeNames?.dark, 20, "Dark"), light: clean(raw?.themeNames?.light, 20, "Light"), meaning: clean(raw?.themeNames?.meaning, 240, "") },
    transition: {
      name: clean(t.name, 40, "Theme change"),
      kind, origin,
      softness: typeof t.softness === "number" ? score(t.softness) : 40,
      blur: typeof t.blur === "number" ? score(t.blur) : kind === "blur-dissolve" ? 60 : 0,
      duration: typeof t.duration === "number" ? Math.min(1400, Math.max(300, Math.round(t.duration))) : 700,
      ease: EASE.test(t.ease ?? "") ? t.ease : "cubic-bezier(0.65,0,0.35,1)",
      rationale: clean(t.rationale, 240, ""),
    },
  };
}

const ORIGIN_POS: Record<Origin, [string, string]> = { switch: ["", ""], center: ["50%", "50%"], top: ["50%", "0%"], bottom: ["50%", "100%"], left: ["0%", "50%"], right: ["100%", "50%"], "top-left": ["0%", "0%"], "bottom-right": ["100%", "100%"] };
const DIR: Record<Origin, string> = { switch: "180deg", center: "180deg", top: "180deg", bottom: "0deg", left: "90deg", right: "270deg", "top-left": "135deg", "bottom-right": "315deg" };
const BLOB = (n: number) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><path d='${["M100 8C150 4 196 46 192 102C188 152 150 196 98 192C46 188 6 150 10 98C14 46 50 12 100 8Z", "M104 6C160 14 194 58 188 108C182 160 140 198 92 190C40 182 4 140 14 88C24 38 56 0 104 6Z", "M96 10C146 0 200 50 190 104C180 156 144 192 100 194C50 196 2 156 8 100C14 50 48 18 96 10Z"][n]}'/></svg>`)}")`;

/** View Transitions CSS for the chosen theme switch, scoped under html.<px>-theme-vt. */
export function transitionCss(id: Identity, p: string) {
  const { kind, duration: d, ease, origin, softness, blur } = id.transition;
  const scope = `html.${p}-theme-vt`;
  const [ox, oy] = origin === "switch" ? [`var(--${p}-vt-x,50%)`, `var(--${p}-vt-y,50%)`] : ORIGIN_POS[origin];
  const at = `${ox} ${oy}`;
  const f = Math.round(2 + softness * 0.2); // feather width in %
  const m = (v: string) => `-webkit-mask:${v}; mask:${v};`;
  const k = (name: string, frames: string) => `@keyframes ${p}-${name} { ${frames} }`;
  const out = blur ? `${scope}::view-transition-old(root) { animation:${p}-leave ${d}ms ${ease} forwards; }\n${k("leave", `to { filter:blur(${Math.round(blur / 6)}px); opacity:${kind === "soft-crossfade" || kind === "blur-dissolve" ? 0 : 0.85}; }`)}\n` : "";
  const nw = (rule: string) => `${scope}::view-transition-new(root) { ${rule} }`;
  const body: Record<TransitionKind, string> = {
    wipe: `${nw(`${m(`linear-gradient(${DIR[origin]}, #000 ${50 - f}%, transparent ${50 + f}%) 0 0 / 300% 300% no-repeat`)} -webkit-mask-position:100% 100%; mask-position:100% 100%; animation:${p}-wipe ${d}ms ${ease} forwards;`)}\n${k("wipe", "to { -webkit-mask-position:0 0; mask-position:0 0; }")}`,
    "circle-reveal": `${nw(`animation:${p}-circle ${d}ms ${ease} forwards;`)}\n${k("circle", `from { clip-path:circle(0 at ${at}); } to { clip-path:circle(150% at ${at}); }`)}`,
    "radial-bloom": `${nw(`${m(`radial-gradient(closest-side, #000 ${70 - f}%, transparent 100%) ${at} / 0 0 no-repeat`)} animation:${p}-bloom ${d}ms ${ease} forwards;`)}\n${k("bloom", `to { -webkit-mask-size:400vmax 400vmax; mask-size:400vmax 400vmax; -webkit-mask-position:calc(${ox} - 200vmax) calc(${oy} - 200vmax); mask-position:calc(${ox} - 200vmax) calc(${oy} - 200vmax); }`)}`,
    "liquid-blob": `${nw(`${m(`${BLOB(0)} ${at} / 0 0 no-repeat`)} animation:${p}-blob ${d}ms ${ease} forwards;`)}\n${k("blob", `0% { -webkit-mask-size:0 0; mask-size:0 0; } 35% { -webkit-mask-image:${BLOB(1)}; mask-image:${BLOB(1)}; } 70% { -webkit-mask-image:${BLOB(2)}; mask-image:${BLOB(2)}; } 100% { -webkit-mask-size:400vmax 400vmax; mask-size:400vmax 400vmax; -webkit-mask-position:calc(${ox} - 200vmax) calc(${oy} - 200vmax); mask-position:calc(${ox} - 200vmax) calc(${oy} - 200vmax); }`)}`,
    ripple: `${nw(`animation:${p}-ripple ${d}ms ${ease} forwards;`)}\n${k("ripple", `0% { clip-path:circle(0 at ${at}); opacity:.4; } 45% { clip-path:circle(40% at ${at}); opacity:.75; } 60% { clip-path:circle(36% at ${at}); } 100% { clip-path:circle(150% at ${at}); opacity:1; }`)}`,
    "soft-crossfade": `${nw(`animation:${p}-fade ${d}ms ${ease} forwards;`)}\n${k("fade", "from { opacity:0; }")}`,
    "blur-dissolve": `${nw(`animation:${p}-focus ${d}ms ${ease} forwards;`)}\n${k("focus", `from { opacity:0; filter:blur(${Math.round(blur / 5) + 4}px); }`)}`,
    iris: `${nw(`animation:${p}-iris ${d}ms ${ease} forwards;`)}\n${k("iris", `from { clip-path:inset(50% 50% 50% 50% round ${Math.round(20 + softness / 2)}%); } to { clip-path:inset(0 0 0 0 round 0); }`)}`,
    shutter: `${nw(`${m(`repeating-linear-gradient(${DIR[origin]}, #000 0 0%, transparent 0% 10%)`)} animation:${p}-shutter ${d}ms ${ease} forwards;`)}\n${k("shutter", Array.from({ length: 11 }, (_, i) => `${i * 10}% { -webkit-mask-image:repeating-linear-gradient(${DIR[origin]}, #000 0 ${i}%, transparent ${i}% 10%); mask-image:repeating-linear-gradient(${DIR[origin]}, #000 0 ${i}%, transparent ${i}% 10%); }`).join(" "))}`,
    "grain-dissolve": `${nw(`${m(`url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 9 -4'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>")}")`)} -webkit-mask-size:160px; mask-size:160px; animation:${p}-grain ${d}ms steps(8) forwards;`)}\n${k("grain", "0% { opacity:0; } 60% { opacity:1; -webkit-mask-size:160px; mask-size:160px; } 100% { opacity:1; -webkit-mask-size:4px; mask-size:4px; -webkit-mask-image:none; mask-image:none; }")}`,
    "slide-push": `${scope}::view-transition-old(root) { animation:${p}-push-out ${d}ms ${ease} forwards; }\n${nw(`animation:${p}-push-in ${d}ms ${ease} forwards;`)}\n${k("push-in", `from { transform:translate(${origin.includes("left") ? "-100%" : origin.includes("right") ? "100%" : "0"}, ${origin.includes("top") || origin === "switch" || origin === "center" ? "-100%" : origin.includes("bottom") ? "100%" : "0"}); }`)}\n${k("push-out", `to { transform:translate(${origin.includes("left") ? "30%" : origin.includes("right") ? "-30%" : "0"}, ${origin.includes("top") || origin === "switch" || origin === "center" ? "30%" : origin.includes("bottom") ? "-30%" : "0"}); opacity:.6; }`)}`,
    "ink-spread": `${nw(`${m(`radial-gradient(closest-side at ${at}, #000 ${60 - f}%, transparent ${60 + f}%) ${at} / 0 0 no-repeat, ${BLOB(1)} ${at} / 0 0 no-repeat`)} animation:${p}-ink ${d}ms ${ease} forwards;`)}\n${k("ink", `to { -webkit-mask-size:400vmax 400vmax, 380vmax 380vmax; mask-size:400vmax 400vmax, 380vmax 380vmax; -webkit-mask-position:calc(${ox} - 200vmax) calc(${oy} - 200vmax), calc(${ox} - 190vmax) calc(${oy} - 190vmax); mask-position:calc(${ox} - 200vmax) calc(${oy} - 200vmax), calc(${ox} - 190vmax) calc(${oy} - 190vmax); }`)}`,
  };
  return `/* Theme transition "${id.transition.name}": ${kind} from ${origin}, softness ${softness}, blur ${blur} — ${id.transition.rationale || "matched to the template's identity"} */\n@media (prefers-reduced-motion: no-preference) {\n${scope}::view-transition-old(root), ${scope}::view-transition-new(root) { animation:none; mix-blend-mode:normal; }\n${scope} * { view-transition-name:none !important; }\n${out}${body[kind]}\n}\n`;
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
  return `## Identity\n\n${id.summary}\n\n${id.descriptors.map((d) => `\`${d}\``).join(" ")}\n\n| Scale | 0 | Score | 100 |\n|---|---|---|---|\n| Playfulness | calm, precise | ${id.playfulness} | warm, playful |\n| Warmth | cool | ${id.warmth} | warm |\n| Expressiveness | quiet | ${id.expressiveness} | bold |\n| Density | airy | ${id.density} | compact |\n\n${id.anchorNote}\n\n**Imagery:** ${id.imagery}\n\n**Motion:** ${id.motionCharacter}\n\n**Themes:** ${id.themeNames.dark} / ${id.themeNames.light}. ${id.themeNames.meaning}\n\n**Theme transition — ${id.transition.name}:** \`${id.transition.kind}\` from ${id.transition.origin}, softness ${id.transition.softness}, blur ${id.transition.blur}, ${id.transition.duration}ms, \`${id.transition.ease}\`. ${id.transition.rationale} See \`dist/theme-transition.css\` and \`dist/theme-transition.js\`.\n`;
}
