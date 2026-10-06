// Static security scan for template HTML files and prompts.
// "block" findings prevent publishing; "warn" findings need a manual review.

export type Severity = "block" | "warn";
export type Finding = { severity: Severity; rule: string; detail: string };
export type ScanReport = {
  ok: boolean;
  scannedAt: string;
  findings: Finding[];
};

const TRUSTED_HOSTS = [
  "cdn.tailwindcss.com",
  "unpkg.com",
  "cdn.jsdelivr.net",
  "cdnjs.cloudflare.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "esm.sh",
  "ga.jspm.io",
];

const isTrusted = (url: string) => {
  try {
    const host = new URL(url, "https://local.invalid").hostname;
    return host === "local.invalid" || TRUSTED_HOSTS.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
};

const HTML_RULES: { re: RegExp; severity: Severity; rule: string; detail: string }[] = [
  { re: /document\.cookie/i, severity: "block", rule: "cookie-access", detail: "Reads or writes cookies." },
  { re: /\b(localStorage|sessionStorage|indexedDB)\b/, severity: "warn", rule: "browser-storage", detail: "Uses browser storage — fine for UI state, check it stores nothing sensitive." },
  { re: /\b(window\.)?(parent|top|opener)\s*\.\s*(location|document|postMessage)/, severity: "block", rule: "frame-escape", detail: "Tries to reach the page that embeds it." },
  { re: /\beval\s*\(/, severity: "block", rule: "eval", detail: "Runs code from a string (eval)." },
  { re: /new\s+Function\s*\(/, severity: "block", rule: "new-function", detail: "Builds code at runtime (new Function)." },
  { re: /\b(setTimeout|setInterval)\s*\(\s*["'`]/, severity: "block", rule: "string-timer", detail: "Runs code from a string in a timer." },
  { re: /\batob\s*\(/, severity: "warn", rule: "base64-decode", detail: "Decodes base64 — check it isn't hiding code." },
  { re: /\\x[0-9a-f]{2}(\\x[0-9a-f]{2}){20,}/i, severity: "block", rule: "obfuscation", detail: "Long hex-escaped string, typical of hidden code." },
  { re: /navigator\.sendBeacon/, severity: "block", rule: "beacon", detail: "Sends data in the background (sendBeacon)." },
  { re: /\b(fetch|XMLHttpRequest|WebSocket|EventSource)\b\s*\(?/, severity: "warn", rule: "network", detail: "Makes network requests — confirm where they go." },
  { re: /navigator\.(geolocation|mediaDevices|clipboard\.read|credentials)/, severity: "block", rule: "sensitive-api", detail: "Asks for location, camera, clipboard or credentials." },
  { re: /<input[^>]+type=["']?password/i, severity: "warn", rule: "password-field", detail: "Contains a password field — make sure it's decorative only." },
  { re: /\bjavascript:/i, severity: "block", rule: "js-url", detail: "Uses javascript: links." },
  { re: /<meta[^>]+http-equiv=["']?refresh/i, severity: "block", rule: "meta-refresh", detail: "Auto-redirects the visitor." },
  { re: /window\.location(\.href)?\s*=|location\.(replace|assign)\s*\(/, severity: "block", rule: "redirect", detail: "Redirects the visitor elsewhere." },
  { re: /crypto\.subtle|CoinHive|coinhive|cryptonight|miner/i, severity: "block", rule: "crypto", detail: "Looks like crypto or mining code." },
  { re: /\bdownload=|\.(exe|msi|dmg|apk|bat|scr|ps1)\b["'?]/i, severity: "block", rule: "file-download", detail: "Triggers or links to executable downloads." },
  { re: /<(object|embed|applet)\b/i, severity: "block", rule: "plugin", detail: "Embeds a plugin object." },
  { re: /<iframe\b/i, severity: "warn", rule: "iframe", detail: "Embeds another page — check the source." },
  { re: /<form[^>]+action=["']?https?:/i, severity: "block", rule: "external-form", detail: "Form submits to an outside site." },
];

export function scanHtml(html: string): Finding[] {
  const findings: Finding[] = [];
  for (const r of HTML_RULES) if (r.re.test(html)) findings.push({ severity: r.severity, rule: r.rule, detail: r.detail });

  for (const m of html.matchAll(/<script[^>]*\ssrc=["']?([^"'\s>]+)/gi)) {
    if (!isTrusted(m[1] ?? "")) findings.push({ severity: "block", rule: "untrusted-script", detail: `Loads a script from an unapproved source: ${m[1]}` });
  }
  for (const m of html.matchAll(/<link[^>]*\shref=["']?(https?:[^"'\s>]+)/gi)) {
    if (!isTrusted(m[1] ?? "")) findings.push({ severity: "warn", rule: "external-asset", detail: `Loads an asset from ${m[1]}` });
  }
  if (html.length > 2_000_000) findings.push({ severity: "block", rule: "size", detail: "File is larger than 2 MB." });
  if (!/<html|<body|<div/i.test(html)) findings.push({ severity: "block", rule: "not-html", detail: "This doesn't look like an HTML page." });
  return findings;
}

export function scanPrompt(prompt: string): Finding[] {
  const findings: Finding[] = [];
  for (const m of prompt.matchAll(/https?:\/\/[^\s)"']+/g)) {
    if (!isTrusted(m[0])) findings.push({ severity: "warn", rule: "prompt-link", detail: `Prompt contains a link: ${m[0]}` });
  }
  if (/curl\s.+\|\s*(ba)?sh|rm\s+-rf|powershell|Invoke-Expression|sudo\s/i.test(prompt))
    findings.push({ severity: "block", rule: "prompt-command", detail: "Prompt contains a risky terminal command." });
  if (/ignore (all |any )?(previous|prior) instructions|disregard .*instructions/i.test(prompt))
    findings.push({ severity: "block", rule: "prompt-injection", detail: "Prompt contains instruction-override wording." });
  if (/api[_-]?key|secret|password|token\s*[:=]/i.test(prompt))
    findings.push({ severity: "warn", rule: "prompt-secret", detail: "Prompt mentions keys, tokens or passwords — make sure none are real." });
  if (/[\u200B-\u200F\u202A-\u202E\u2066-\u2069]/.test(prompt))
    findings.push({ severity: "block", rule: "hidden-characters", detail: "Prompt contains invisible characters that can hide text." });
  return findings;
}

export function buildReport(html: string | null, prompt: string): ScanReport {
  const findings = [...(html ? scanHtml(html) : []), ...scanPrompt(prompt)];
  return { ok: !findings.some((f) => f.severity === "block"), scannedAt: new Date().toISOString(), findings };
}
