import { parseHTML } from "linkedom";
import * as css from "css-tree";

export type SourceVisuals = { css: string; cardCss: string; cards: { name: string; html: string }[]; illustrations: { name: string; html: string }[]; tasks: string; themeToggle: string; animations: string[] };
const tags = new Set("div span p h1 h2 h3 h4 h5 h6 strong b em i small section article label button input svg g path circle ellipse rect line polyline polygon defs lineargradient radialgradient stop clippath mask title desc use".split(" "));
const attrs = /^(class|id|role|title|type|checked|disabled|tabindex|viewbox|width|height|d|x|y|x1|x2|y1|y2|cx|cy|r|rx|ry|points|fill|stroke|stroke-width|stroke-linecap|stroke-linejoin|stroke-dasharray|stroke-dashoffset|opacity|transform|xmlns|offset|stop-color|stop-opacity|clip-path|mask|preserveaspectratio|aria-[\w-]+|data-mode|data-theme)$/i;
const safeValue = (v: string) => !/[<>]|javascript:|expression\(|@import|(?:https?:|data:|\/\/)/i.test(v) && !/url\((?!["']?#)/i.test(v);

/** Keep declarative vector art and CSS only. Never carry template scripts, remote resources or event handlers into a package. */
export function extractSourceVisuals(html: string): SourceVisuals {
  const { document } = parseHTML(html);
  const animations: string[] = [];
  const ast = css.parse(Array.from(document.querySelectorAll("style")).map((el) => el.textContent).join("\n"));
  const vars = new Map<string, string>();
  const cardRules: string[] = [];
  css.walk(ast, { visit: "Rule", enter(rule) {
    const selector = css.generate(rule.prelude);
    if (selector === ":root") css.walk(rule.block, { visit: "Declaration", enter(d) { if (d.property.startsWith("--")) vars.set(d.property, css.generate(d.value)); } });
    if (!this.atrule && /^\.(habit|card)(:hover)?$/.test(selector)) {
      const declarations: string[] = [];
      css.walk(rule.block, { visit: "Declaration", enter(d) {
        if (/^(border|border-radius|padding|gap|transform|box-shadow|transition)$/.test(d.property)) declarations.push(`${d.property}:${css.generate(d.value)}`);
      } });
      cardRules.push(`.ds-card${selector.endsWith(":hover") ? ":hover" : ""}{${declarations.join(";")}}`);
    }
  } });
  let cardCss = cardRules.join("\n");
  for (let i = 0; i < 5; i++) cardCss = cardCss.replace(/var\((--[\w-]+)\)/g, (all, key) => vars.get(key) ?? all);
  if (!safeValue(cardCss)) cardCss = "";
  css.walk(ast, {
    visit: "Atrule",
    enter(node, item, list) {
      if (!["media", "supports", "keyframes", "-webkit-keyframes"].includes(node.name.toLowerCase())) { if (item && list) list.remove(item); }
      else if (/keyframes$/.test(node.name) && node.prelude) animations.push(css.generate(node.prelude));
    },
  });
  css.walk(ast, {
    visit: "Declaration",
    enter(node, item, list) {
      const value = css.generate(node.value);
      if (!safeValue(value) || /^(behavior|content|z-index)$/i.test(node.property) || (node.property === "position" && /fixed|sticky/.test(value))) { if (item && list) list.remove(item); }
    },
  });
  css.walk(ast, {
    visit: "Rule",
    enter(node) {
      if (this.atrule && /keyframes$/.test(this.atrule.name)) return;
      const selectors = css.generate(node.prelude).split(",");
      // Splitting is delegated to the parser's selector list, so commas inside :is() remain intact.
      const parsed = node.prelude.type === "SelectorList" ? node.prelude.children.toArray().map((n) => css.generate(n)) : selectors;
      const scoped = parsed.map((sel) => /^(?:\*|:root|html|body)(?:$|[\s:.\[])/.test(sel)
        ? sel.replace(/^(?:\*|:root|html|body)/, ".template-source")
        : /^\[data-(mode|theme)=/.test(sel) ? ".template-source" + sel : ".template-source " + sel);
      node.prelude = css.parse(scoped.join(","), { context: "selectorList" });
    },
  });
  let sourceCss = css.generate(ast);
  for (const name of animations) sourceCss = sourceCss.replace(new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"), "source-" + name);

  let serial = 0;
  function sanitize(el: Element): string {
    const clone = el.cloneNode(true) as Element;
    const nodes = [clone, ...Array.from(clone.querySelectorAll("*"))];
    const ids = new Map<string, string>();
    nodes.forEach((n) => { if (n.id) ids.set(n.id, `visual-${serial}-${n.id.replace(/[^\w-]/g, "")}`); }); serial++;
    for (const n of nodes) {
      if (!tags.has(n.tagName.toLowerCase())) { n.remove(); continue; }
      for (const a of Array.from(n.attributes)) {
        if (a.name === "style") {
          try { const declarations = css.parse(a.value, { context: "declarationList" }); css.walk(declarations, { visit: "Declaration", enter(d, item, list) { if (!safeValue(css.generate(d.value)) || /position|content|z-index/.test(d.property)) { if (item && list) list.remove(item); } } }); n.setAttribute("style", css.generate(declarations)); } catch { n.removeAttribute("style"); }
        } else if (!attrs.test(a.name) || !safeValue(a.value)) n.removeAttribute(a.name);
      }
      if (n.tagName.toLowerCase() === "button") n.setAttribute("type", "button");
      if (n.id) n.id = ids.get(n.id) ?? n.id;
      for (const a of Array.from(n.attributes)) for (const [old, value] of ids) if (a.value.includes(`#${old}`)) n.setAttribute(a.name, a.value.replaceAll(`#${old}`, `#${value}`));
    }
    return clone.outerHTML;
  }
  const cards = Array.from(document.querySelectorAll(".habit, .step, .steps > article, .steps > div" )).slice(0, 12).map((el, i) => ({ name: el.querySelector("h2,h3,h4")?.textContent?.trim() || `Card ${i + 1}`, html: sanitize(el) }));
  const seen = new Set<string>();
  const illustrations = Array.from(document.querySelectorAll("svg")).filter((el) => { const shape = el.innerHTML; if (seen.has(shape)) return false; seen.add(shape); return true; }).slice(0, 80).map((el, i) => {
    let markup = sanitize(el);
    let parent = el.parentElement;
    for (let n = 0; n < 3 && parent && !/^(BODY|HTML|MAIN)$/.test(parent.tagName); n++, parent = parent.parentElement) {
      const classes = (parent.getAttribute("class") ?? "").replace(/[^\w\s-]/g, "");
      markup = `<div class="${classes}">${markup}</div>`;
    }
    return { name: el.querySelector("title")?.textContent || `Illustration / icon ${i + 1}`, html: markup };
  });
  const tasks = Array.from(document.querySelectorAll('.item[aria-pressed]')).slice(0, 5).map(sanitize).join("");
  const toggle = document.querySelector('.theme-toggle, .theme-switch, .mode-toggle, .toggle-theme, .theme-btn, .mode-btn, button[aria-label*="theme" i], button[aria-label*="mode" i]');
  return { css: sourceCss, cardCss, cards, illustrations, tasks, themeToggle: toggle ? sanitize(toggle) : "", animations };
}

export const sourceVisualCss = (v: SourceVisuals) => v.css + `
.template-source { width:100%;min-width:0;isolation:isolate;font-family:var(--font-body);color:var(--ink); }
.template-source *, .template-source *::before, .template-source *::after { box-sizing:border-box; }
.source-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(min(250px,100%),1fr));gap:24px;width:100%; }
.source-figure { margin:0;min-width:0; }
.source-figure figcaption { margin-top:14px;font-size:13px; }
.source-art { min-height:180px;display:grid;place-items:center;overflow:hidden; }
.source-art svg { max-width:100%;max-height:300px; }
.source-tasks { display:grid;gap:12px;max-width:500px; }
.template-source [data-mode],.template-source { transition:background .6s var(--soft,ease),color .6s var(--soft,ease); }
.template-source[data-mode="day"] .is-night,.template-source[data-mode="night"] .is-day { display:none; }
@media(prefers-reduced-motion:reduce) { .template-source *, .template-source *::before,.template-source *::after { animation:none!important;transition:none!important; } }
`;