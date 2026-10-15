export type DsTheme = "dark" | "light";
/** Preview-only bridge: use the page's own toggle where possible, preserving its motion and state. */
const THEME_BRIDGE = `<script data-preview-theme-bridge>(function(){
var root=document.documentElement;
function read(){var t=root.getAttribute('data-theme')||(document.body&&document.body.getAttribute('data-theme'));return t==='light'||t==='dark'?t:root.classList.contains('dark')?'dark':root.classList.contains('light')?'light':matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
function notify(){parent.postMessage({type:'hy-theme-changed',theme:read()},'*');}
function apply(t){if(read()===t){notify();return;}
var controls=Array.from(document.querySelectorAll('button,[role="switch"],[role="radio"]'));
var toggle=controls.find(function(el){return el.getClientRects().length&&(/theme|dark|light/i.test(el.getAttribute('aria-label')||'')||/theme/i.test(el.id));});
if(toggle){var target=controls.find(function(el){return el.getClientRects().length&&(el.getAttribute('data-theme')===t||el.getAttribute('data-value')===t||new RegExp('^'+t+'(?: theme| mode)?$','i').test(el.getAttribute('aria-label')||el.textContent.trim()));});(target||toggle).click();}
setTimeout(function(){if(read()!==t){root.setAttribute('data-theme',t);if(document.body&&document.body.hasAttribute('data-theme'))document.body.setAttribute('data-theme',t);[root,document.body].filter(Boolean).forEach(function(el){if(el.classList.contains('dark')||el.classList.contains('light')){el.classList.toggle('dark',t==='dark');el.classList.toggle('light',t==='light');}});}notify();},80);
}
window.addEventListener('message',function(e){if(e.source!==parent)return;var d=e.data;if(!d)return;if(d.type==='hy-theme'&&(d.theme==='dark'||d.theme==='light'))apply(d.theme);if(d.type==='hy-theme-read')notify();});
function ready(){new MutationObserver(notify).observe(root,{attributes:true,attributeFilter:['data-theme','class']});if(document.body)new MutationObserver(notify).observe(document.body,{attributes:true,attributeFilter:['data-theme','class']});notify();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();</script>`;

/** Sets an optional starting theme and equips sandboxed HTML with a theme message listener. */
export function withTheme(html: string, theme?: DsTheme): string {
  let result = html;
  if (theme) {
    result = /<html\b[^>]*>/i.test(result)
      ? result.replace(/<html\b([^>]*)>/i, (_, attrs: string) => `<html${attrs.replace(/\sdata-theme\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i, "")} data-theme="${theme}">`)
      : `<html data-theme="${theme}">${result}</html>`;
  }
  if (result.includes('data-preview-theme-bridge')) return result;
  return /<\/body\s*>/i.test(result) ? result.replace(/<\/body\s*>/i, () => `${THEME_BRIDGE}</body>`) : result + THEME_BRIDGE;
}
/** Switches the theme of a loaded guidelines iframe without reloading it (keeps scroll position). */
export const postTheme = (frame: HTMLIFrameElement | null, theme: DsTheme) =>
  frame?.contentWindow?.postMessage({ type: "hy-theme", theme }, "*");
