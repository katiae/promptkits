/** CSS-only touch simulation for uploaded HTML; never alters the saved/downloaded template. */
export function foldablePreviewHtml(html: string): string {
  return html.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi, (_, open: string, css: string, close: string) =>
    open + css.replace(/\(\s*pointer\s*:\s*(coarse|fine)\s*\)/gi, (_, pointer: string) =>
      pointer.toLowerCase() === "coarse" ? "(min-width: 0px)" : "(max-width: 0px)",
    ) + close,
  );
}

/**
 * srcdoc frames inherit the host page URL, so "#section" links would load the host app
 * inside the preview. This keeps in-page links scrolling and blocks other navigations.
 */
const LINK_GUARD = `<script>(function(){document.addEventListener("click",function(e){if(e.defaultPrevented)return;var a=e.target&&e.target.closest&&e.target.closest("a[href]");if(!a)return;var h=a.getAttribute("href")||"";if(/^(mailto:|tel:)/i.test(h))return;e.preventDefault();if(h.charAt(0)==="#"&&h.length>1){var t=null;try{t=document.getElementById(decodeURIComponent(h.slice(1)))||document.querySelector(h)}catch(_){}if(t)t.scrollIntoView({behavior:"smooth",block:"start"});}else if(h==="#"){window.scrollTo({top:0,behavior:"smooth"});}});})();</script>`;

export function linkGuardHtml(html: string): string {
  return /<\/body\s*>/i.test(html) ? html.replace(/<\/body\s*>/i, `${LINK_GUARD}</body>`) : html + LINK_GUARD;
}

/** Templates that should open in dark mode instead of following the visitor's system setting. */
const DARK_BY_DEFAULT = new Set(["halyard"]);

/** Starts listed templates in dark mode; their own theme switch still works. */
export function defaultThemeHtml(slug: string, html: string): string {
  if (!DARK_BY_DEFAULT.has(slug.toLowerCase())) return html;
  if (/<html[^>]*data-theme=/i.test(html)) return html;
  if (/<html[^>]*>/i.test(html)) return html.replace(/<html/i, '<html data-theme="dark"');
  return `<html data-theme="dark">${html}`;
}
