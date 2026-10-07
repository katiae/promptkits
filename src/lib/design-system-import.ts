import { unzipSync, strFromU8 } from "fflate";
import { parseHTML } from "linkedom";
import { scanHtml, type Finding, type ScanReport } from "./security-scanner";

export const IMPORT_META = "__promptfolio_import.json";
export type ImportResult = { report: ScanReport; files: Record<string, Uint8Array>; count: number };
const MAX_ZIP = 10_000_000;
const MAX_TOTAL = 40_000_000;
const textExtension = /\.(md|txt|json|css|html?|svg|tsx?|jsx?|mjs|cjs|yaml|yml)$/i;
const allowedExtension = /\.(md|txt|json|css|html?|svg|tsx?|jsx?|mjs|cjs|yaml|yml|png|jpe?g|webp|gif|ico|woff2?|ttf|otf)$/i;
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

/** Validate the original central directory before inflation (fflate normalizes unsafe paths). */
export function inspectDesignSystemZip(bytes: Uint8Array): ImportResult {
  const findings: Finding[] = [];
  const block = (detail: string) => findings.push({ severity: "block", rule: "archive", detail });
  let files: Record<string, Uint8Array> = {};
  try {
    if (bytes.length > MAX_ZIP || bytes.length < 22) throw new Error("Choose a ZIP smaller than 10 MB.");
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let end = bytes.length - 22;
    while (end >= Math.max(0, bytes.length - 65557) && view.getUint32(end, true) !== 0x06054b50) end--;
    if (end < 0 || view.getUint32(end, true) !== 0x06054b50) throw new Error("This ZIP is damaged or unsupported.");
    const count = view.getUint16(end + 10, true);
    if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true) || count > 600) throw new Error("Use a standard ZIP with at most 600 files.");
    let offset = view.getUint32(end + 16, true), total = 0;
    const names = new Set<string>();
    for (let i = 0; i < count; i++) {
      if (view.getUint32(offset, true) !== 0x02014b50) throw new Error("Invalid ZIP directory.");
      const length = view.getUint16(offset + 28, true);
      const name = strFromU8(bytes.subarray(offset + 46, offset + 46 + length));
      const size = view.getUint32(offset + 24, true);
      const mode = view.getUint32(offset + 38, true) >>> 16;
      if (view.getUint16(offset + 8, true) & 1) throw new Error("Encrypted ZIPs cannot be scanned.");
      if ((mode & 0xf000) === 0xa000) throw new Error("Symbolic links are not allowed.");
      if (/^[/\\]|\\|(^|\/)\.\.?($|\/)|:|[\x00-\x1f]/.test(name) || name.length > 240) throw new Error("ZIP contains an unsafe file path.");
      if (names.has(name)) throw new Error("ZIP contains duplicate file names.");
      names.add(name);
      if (!name.endsWith("/")) {
        if (!allowedExtension.test(name) || /(^|\/)(node_modules|\.git|\.env[^/]*)(\/|$)/i.test(name)) block(`${name}: unsupported or private file. Remove it from the ZIP.`);
        total += size;
        if (size > 5_000_000 || total > MAX_TOTAL) throw new Error("ZIP expands beyond the limit: 5 MB per file, 40 MB total.");
      }
      offset += 46 + length + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true);
    }
    if (findings.length) throw new Error("Remove blocked files before uploading.");
    files = unzipSync(bytes);
    for (const [name, content] of Object.entries(files)) {
      if (name.endsWith("/")) { delete files[name]; continue; }
      if (!textExtension.test(name)) continue;
      const text = strFromU8(content);
      const add = (severity: "block" | "warn", rule: string, detail: string) => findings.push({ severity, rule, detail: `${name}: ${detail}` });
      if (/\.(html?|svg)$/i.test(name)) {
        for (const f of scanHtml(/\.svg$/i.test(name) ? `<div>${text}</div>` : text)) add(f.severity, f.rule, f.detail);
      }
      if (/\b(eval\s*\(|new\s+Function\s*\(|child_process|execSync\s*\(|spawnSync\s*\(|document\.cookie|navigator\.sendBeacon)|(?:curl|wget)[^\n]*\|\s*(?:ba)?sh|rm\s+-rf|powershell|Invoke-Expression/i.test(text)) add("block", "risky-code", "Contains potentially dangerous executable code or commands.");
      if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:sk_live_|sk-proj-|ghp_)[\w-]{16,}/.test(text)) add("block", "secret", "Contains what looks like a private credential.");
      if (/(?:^|\/)package\.json$/.test(name)) {
        try {
          const pkg = JSON.parse(text);
          if (Object.keys(pkg.scripts ?? {}).some((s) => /^(preinstall|install|postinstall|prepare|prepublish|prepublishOnly)$/.test(s))) add("block", "install-hook", "Automatic installation scripts must be removed.");
          if (pkg.dependencies || pkg.devDependencies) add("warn", "dependencies", "Dependencies need developer review before installation; they are not executed by this scan.");
        } catch { add("block", "invalid-json", "Invalid package.json."); }
      }
      if (/\b(fetch|XMLHttpRequest|WebSocket)\s*\(/.test(text)) add("warn", "network", "Contains network calls; review destinations before using these files.");
    }
    if (!Object.keys(files).some((n) => textExtension.test(n))) block("Include tokens, components, documentation or guidelines files.");
  } catch (e) { block(e instanceof Error ? e.message : "Unable to inspect this ZIP."); }
  return { files, count: Object.keys(files).length, report: { ok: !findings.some((f) => f.severity === "block"), scannedAt: new Date().toISOString(), findings } };
}

function safePreview(html: string, files: Record<string, Uint8Array>, path: string) {
  const { document } = parseHTML(html);
  const resolve = (relative: string) => {
    const parts = path.split("/").slice(0, -1);
    for (const part of relative.split("/")) { if (part === "..") parts.pop(); else if (part && part !== ".") parts.push(part); }
    return parts.join("/");
  };
  document.querySelectorAll("script,iframe,object,embed,base,meta,form").forEach((el) => el.remove());
  document.querySelectorAll('link[rel="stylesheet"]').forEach((el) => {
    const css = files[resolve(el.getAttribute("href") ?? "")];
    if (css) { const style = document.createElement("style"); style.textContent = strFromU8(css); el.replaceWith(style); } else el.remove();
  });
  document.querySelectorAll("*").forEach((el) => {
    for (const a of Array.from(el.attributes)) {
      if (/^on/i.test(a.name) || /^(href|src|action|formaction|srcdoc|srcset)$/i.test(a.name)) el.removeAttribute(a.name);
    }
  });
  return `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'"></head><body>${document.documentElement?.outerHTML ?? ""}</body></html>`;
}

/** Deterministic guidelines from the actual package; never invent a replacement component system or execute uploaded code. */
export function buildImportedGuidelines(name: string, files: Record<string, Uint8Array>) {
  const entries = Object.entries(files).filter(([p]) => textExtension.test(p));
  const groups = [
    { id: "foundations", title: "Foundations & tokens", match: /tokens?|theme|variables|\.css$/i },
    { id: "components", title: "Components & patterns", match: /\.(tsx?|jsx?|mjs|cjs)$/i },
    { id: "documentation", title: "Documentation & configuration", match: /\.(md|txt|json|yaml|yml)$/i },
  ];
  const preview = entries.filter(([p]) => /\.html?$/i.test(p));
  const sections = groups.map((g) => {
    const items = entries.filter(([p]) => g.match.test(p));
    return `<section id="${g.id}"><h2>${g.title}</h2>${items.length ? items.map(([p, b]) => {
      const text = strFromU8(b);
      const colors = [...new Set(text.match(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi) ?? [])].slice(0, 48);
      return `<article><h3>${escape(p)}</h3>${g.id === "foundations" ? `<div class="swatches">${colors.map((c) => `<div><span style="background:${c}"></span><code>${c}</code></div>`).join("")}</div>` : ""}<details ${/\.(md|txt)$/i.test(p) ? "open" : ""}><summary>View file</summary><pre>${escape(text)}</pre></details></article>`;
    }).join("") : "<p>No files in this category.</p>"}</section>`;
  }).join("");
  return `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; frame-src about:; base-uri 'none'; form-action 'none'"><title>${escape(name)} design system</title><style>
  :root{--bg:#f8f9f7;--surface:#fff;--ink:#21372d;--muted:#65716b;--line:#dce2dd;--code:#eef2ed}html[data-theme=dark]{--bg:#171d19;--surface:#202922;--ink:#edf3ec;--muted:#a6b5a9;--line:#39463c;--code:#18201a}*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:32px}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.65 system-ui,sans-serif;transition:background .4s,color .4s}nav{position:fixed;inset:0 auto 0 0;width:240px;padding:32px 24px;border-right:1px solid var(--line)}nav a{display:block;color:var(--muted);text-decoration:none;margin:16px 0}main{margin-left:240px;max-width:1200px;padding:48px}h1{font-size:36px;line-height:1.2}h2{font-size:26px}h3{font-size:16px;overflow-wrap:anywhere}section{margin-top:64px}article{margin-top:24px;padding:24px 0;border-top:1px solid var(--line)}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--code);padding:20px;border-radius:8px;font-size:13px}summary{cursor:pointer;color:var(--muted)}.swatches{display:flex;flex-wrap:wrap;gap:16px;margin:24px 0}.swatches span{display:block;width:80px;height:64px;border:1px solid var(--line);border-radius:8px}iframe{width:100%;height:720px;border:1px solid var(--line);border-radius:8px;background:var(--surface)}@media(max-width:760px){nav{position:static;width:auto;border-right:0;border-bottom:1px solid var(--line)}nav a{display:inline-block;margin:8px 16px 0 0}main{margin:0;padding:24px}h1{font-size:30px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}body{transition:none}}
  </style></head><body><nav><strong>${escape(name)}</strong>${preview.length ? '<a href="#previews">Guidelines & specimens</a>' : ""}${groups.map((g) => `<a href="#${g.id}">${g.title}</a>`).join("")}</nav><main><h1>${escape(name)} design system</h1><p>Imported package · ${Object.keys(files).length} files</p>${preview.length ? `<section id="previews"><h2>Guidelines & specimens</h2>${preview.map(([p, b]) => `<article><h3>${escape(p)}</h3><iframe sandbox="" title="${escape(p)}" srcdoc="${escape(safePreview(strFromU8(b), files, p))}"></iframe></article>`).join("")}</section>` : ""}${sections}</main><script>window.addEventListener('message',function(e){if(e.source!==parent)return;if(e.data&&e.data.type==='hy-theme'&&(e.data.theme==='dark'||e.data.theme==='light'))document.documentElement.dataset.theme=e.data.theme;});</script></body></html>`;
}