const CAPTURE_WIDTH = 1280;
const CAPTURE_HEIGHT = 800;

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

async function waitForImages(doc: Document) {
  const images = Array.from(doc.images);
  await Promise.all(
    images.map(async (image) => {
      if (!image.complete) {
        await Promise.race([
          new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          }),
          wait(4_000),
        ]);
      }
      if (image.complete && image.naturalWidth > 0) {
        await image.decode().catch(() => undefined);
      }
    }),
  );
}

async function settleTemplate(iframe: HTMLIFrameElement, doc: Document) {
  const view = iframe.contentWindow;
  if (!view) return;

  // Wake up common scroll- and intersection-driven reveal effects.
  view.dispatchEvent(new Event("resize"));
  view.dispatchEvent(new Event("scroll"));
  doc.dispatchEvent(new Event("scroll"));
  view.scrollTo(0, Math.min(240, Math.max(0, doc.documentElement.scrollHeight - CAPTURE_HEIGHT)));
  await wait(100);
  view.scrollTo(0, 0);

  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  await wait(2_500);

  // Finish Web Animations API effects at their intended end state.
  for (const animation of doc.getAnimations()) {
    try {
      animation.finish();
    } catch {
      // Infinite animations cannot be finished and are safe to leave running.
    }
  }

  // html-to-image clones the DOM before painting it. Without this override,
  // CSS entrance animations restart inside that fresh clone and the JPEG is
  // taken from their opacity:0 first frame.
  const freezeStyle = doc.createElement("style");
  freezeStyle.dataset.thumbnailCapture = "true";
  freezeStyle.textContent = `
    *, *::before, *::after {
      animation-delay: 0s !important;
      animation-duration: 0s !important;
      animation-iteration-count: 1 !important;
      transition: none !important;
      scroll-behavior: auto !important;
    }
  `;
  doc.head.appendChild(freezeStyle);

  // Some templates keep hero content at opacity:0 until an observer adds a
  // class. If that observer cannot see the hidden capture frame, reveal only
  // zero-opacity elements that occupy the captured viewport.
  for (const element of Array.from(doc.body.querySelectorAll<HTMLElement>("*"))) {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0 || rect.bottom <= 0 || rect.top >= CAPTURE_HEIGHT) continue;
    const style = view.getComputedStyle(element);
    if (style.display === "none") continue;
    if (Number.parseFloat(style.opacity) === 0) {
      element.style.setProperty("opacity", "1", "important");
      element.style.setProperty("transform", "none", "important");
      element.style.setProperty("visibility", "visible", "important");
    }
  }

  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

// Renders template HTML in an invisible in-viewport frame and captures its top viewport.
// Keeping the frame in the viewport is important: templates commonly reveal their hero
// with IntersectionObserver, which never fires when the frame is positioned off-screen.
export async function captureThumbnail(html: string): Promise<string> {
  const { toJpeg } = await import("html-to-image");
  const iframe = document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = [
    "position:fixed",
    "inset:0 auto auto 0",
    `width:${CAPTURE_WIDTH}px`,
    `height:${CAPTURE_HEIGHT}px`,
    "border:0",
    "opacity:0",
    "pointer-events:none",
    "z-index:-2147483647",
  ].join(";");
  document.body.appendChild(iframe);
  try {
    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      iframe.srcdoc = html;
    });
    const doc = iframe.contentDocument;
    if (!doc) throw new Error("Could not render the template");
    await doc.fonts?.ready;
    await waitForImages(doc);

    await settleTemplate(iframe, doc);
    const root = doc.documentElement;
    return await toJpeg(root, {
      width: CAPTURE_WIDTH,
      height: CAPTURE_HEIGHT,
      canvasWidth: 800,
      canvasHeight: 500,
      quality: 0.82,
      backgroundColor: getComputedStyle(doc.body).backgroundColor || "#ffffff",
      style: { overflow: "hidden" },
      skipFonts: true,
    });
  } finally {
    iframe.remove();
  }
}
