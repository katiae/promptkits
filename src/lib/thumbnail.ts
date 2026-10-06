// Renders template HTML offscreen and captures the top viewport as a small JPEG data URL.
export async function captureThumbnail(html: string): Promise<string> {
  const { toJpeg } = await import("html-to-image");
  const iframe = document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
  iframe.style.cssText = "position:fixed;left:-10000px;top:0;width:1280px;height:800px;border:0;";
  document.body.appendChild(iframe);
  try {
    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      iframe.srcdoc = html;
    });
    const doc = iframe.contentDocument;
    if (!doc) throw new Error("Could not render the template");
    await doc.fonts?.ready;
    await new Promise((r) => setTimeout(r, 1500)); // let entrance animations settle
    const root = doc.documentElement;
    return await toJpeg(root, {
      width: 1280,
      height: 800,
      canvasWidth: 800,
      canvasHeight: 500,
      quality: 0.82,
      backgroundColor: getComputedStyle(doc.body).backgroundColor || "#ffffff",
      style: { overflow: "hidden" },
    });
  } finally {
    iframe.remove();
  }
}
