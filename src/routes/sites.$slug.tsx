import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { ArrowUpRight, Copy, Check, Download } from "lucide-react";
import { lovableBuildUrl } from "@/lib/lovable-link";
import { designSystemPromptSection } from "@/lib/lovable-ds-prompt";
import { listDesignSystems, getLovableDesignSystemFiles } from "@/lib/design-system.functions";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { FavHeart } from "@/components/FavHeart";
import { toast } from "sonner";
import { entryMetaQuery, entryContentQuery } from "@/lib/entries";
import { useFavorites } from "@/hooks/use-favorites";
import { OrbThumb } from "@/components/Orb";
import { DeviceSwitcher, DeviceFrame, type Device } from "@/components/DevicePreview";
import { buildReport } from "@/lib/security-scanner";
import { DesignSystemButton } from "@/components/DesignSystemButton";
import { foldablePreviewHtml, defaultThemeHtml, linkGuardHtml } from "@/lib/device-preview";
import { ThemeToggle } from "@/components/ThemeToggle";
import { withTheme, supportsPreviewThemes } from "@/lib/ds-theme";
import { usePreviewTheme } from "@/hooks/use-preview-theme";

export const Route = createFileRoute("/sites/$slug")({
  staticData: { sitemap: true },
  loader: async ({ params, context }) => {
    try { return await context.queryClient.ensureQueryData(entryMetaQuery(params.slug)); } catch { return null; }
  },
  head: ({ params, loaderData }) => {
    const name = loaderData?.name ?? params.slug.replace(/-/g, " ");
    const title = `${name} interface template — Promptfolio`;
    const desc = loaderData?.description || `Try the ${name} interface template and copy its complete AI build prompt.`;
    const url = `https://promptkits.dev/sites/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(loaderData?.thumbnail_url
          ? [
              { property: "og:image", content: `https://promptkits.dev/api/public/thumb/${params.slug}` },
              { name: "twitter:image", content: `https://promptkits.dev/api/public/thumb/${params.slug}` },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: loaderData
        ? [{
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: loaderData.name,
              description: loaderData.description,
              applicationCategory: "DesignApplication",
              operatingSystem: "Web",
              url,
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            }),
          }]
        : [],
    };
  },
  component: Detail,
});

function DetailSkeleton() {
  return (
    <main className="mx-auto max-w-[1600px] px-6 pt-12" aria-busy="true" aria-label="Loading template">
      <div className="template-skeleton" aria-hidden="true">
        <div className="h-3 w-24 rounded bg-secondary" />
        <div className="mt-6 flex flex-wrap items-end gap-4">
          <div className="flex-1">
            <div className="h-3 w-20 rounded bg-secondary" />
            <div className="mt-3 h-10 w-2/5 rounded-lg bg-muted" />
            <div className="mt-3 h-4 w-3/5 rounded bg-secondary" />
            <div className="mt-4 flex gap-1.5">
              <div className="h-5 w-16 rounded-full bg-secondary" />
              <div className="h-5 w-20 rounded-full bg-secondary" />
              <div className="h-5 w-14 rounded-full bg-secondary" />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-8 w-28 rounded-full bg-muted" />
            <div className="h-8 w-36 rounded-full bg-secondary" />
            <div className="h-8 w-20 rounded-full bg-secondary" />
          </div>
        </div>
        <div className="mt-6 overflow-hidden rounded-3xl bg-tray p-2 lg:grid lg:grid-cols-[1.45fr_1fr] lg:gap-2">
          <div className="rounded-2xl bg-card p-2">
            <div className="skeleton-art skeleton-palette-1 relative h-[620px] w-full overflow-hidden rounded-xl bg-tray">
              <div className="skeleton-cloud skeleton-cloud-first" />
              <div className="skeleton-cloud skeleton-cloud-second" />
            </div>
          </div>
          <div className="hidden flex-col rounded-2xl bg-card p-5 lg:flex">
            <div className="h-3 w-24 rounded bg-secondary" />
            <div className="mt-6 space-y-3">
              <div className="h-3.5 w-11/12 rounded bg-secondary" />
              <div className="h-3.5 w-full rounded bg-secondary" />
              <div className="h-3.5 w-4/5 rounded bg-secondary" />
              <div className="h-3.5 w-11/12 rounded bg-secondary" />
              <div className="h-3.5 w-2/3 rounded bg-secondary" />
              <div className="h-3.5 w-5/6 rounded bg-secondary" />
              <div className="h-3.5 w-3/4 rounded bg-secondary" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Detail() {
  const { slug } = Route.useParams();
  const { data: entry, isLoading } = useQuery(entryMetaQuery(slug));
  const { data: content, isLoading: contentLoading } = useQuery(entryContentQuery(slug));
  const { isFav, toggle } = useFavorites();
  const [tab, setTab] = useState<"demo" | "prompt">("demo");
  const [copied, setCopied] = useState(false);
  const [device, setDevice] = useState<Device>("desktop");
  const { theme, setTheme, frameRef, onLoad } = usePreviewTheme();
  useEffect(() => { if (entry?.slug) track(entry.slug, "view"); }, [entry?.slug]);
  // Members get the template's design system code added to the Lovable prompt (fetched ahead so the click opens instantly).
  const { user } = useAuth();
  const listDs = useServerFn(listDesignSystems);
  const getDs = useServerFn(getLovableDesignSystemFiles);
  const { data: dsSlugs } = useQuery({ queryKey: ["design-systems"], queryFn: () => listDs(), staleTime: 600_000 });
  const hasDs = !!dsSlugs?.includes(slug);
  const { data: dsFiles } = useQuery({ queryKey: ["lovable-ds", slug, user?.id], queryFn: () => getDs({ data: { slug } }), enabled: !!user && hasDs, staleTime: 600_000 });

  if (isLoading) return <DetailSkeleton />;
  if (!entry)
    return (
      <main className="py-32 text-center">
        <h1 className="font-serif text-4xl">Not found</h1>
        <Link to="/" className="mt-4 inline-block text-muted-foreground underline">Back to browse</Link>
      </main>
    );

  const copy = async () => {
    await navigator.clipboard.writeText(content?.prompt ?? "");
    track(entry.slug, "copy_prompt");
    setCopied(true);
    toast.success("Prompt copied");
    setTimeout(() => setCopied(false), 1800);
  };
  const fav = isFav(entry.id);
  const html = content?.html_content && buildReport(content.html_content, "").ok ? defaultThemeHtml(slug, content.html_content) : null;
  const hasDemo = !!(html || entry.demo_url);
  const openDemo = () => {
    const url = html
      ? `${window.location.origin}/sites/${entry.slug}/live-demo`
      : entry.demo_url;
    if (url) { track(entry.slug, "open_demo_tab"); window.open(url, "_blank", "noopener"); }
  };
  const openInLovable = () => {
    const prompt = (content?.prompt ?? "") + designSystemPromptSection(entry.name, dsFiles?.files ?? {});
    const demo = html ? `https://promptkits.dev/sites/${entry.slug}/live-demo` : entry.demo_url;
    const url = lovableBuildUrl(prompt, demo);
    track(entry.slug, "open_in_lovable");
    if (!url) {
      void navigator.clipboard.writeText(prompt);
      toast.message("Prompt and design system copied. Paste them into a new Lovable project.");
      window.open("https://lovable.dev", "_blank", "noopener");
      return;
    }
    window.open(url, "_blank", "noopener");
  };
  const download = () => {
    if (!html) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    a.download = `${entry.slug}.html`;
    track(entry.slug, "download_html");
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <main className="mx-auto max-w-[1600px] px-6 pt-12">
      <Link to="/" className="label-mono text-muted-foreground hover:text-foreground">← All templates</Link>
      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <h1 className="font-serif text-5xl tracking-tight">{entry.name}</h1>
          <p className="mt-2 text-muted-foreground">{entry.description}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {entry.tags.map((t) => (
              <Link key={t} to="/tag/$slug" params={{ slug: t }} className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground hover:text-foreground">
                {t}
              </Link>
            ))}
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
          {hasDemo ? (
            <button onClick={openDemo} className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-primary-foreground hover:opacity-90">
              Open demo <ArrowUpRight className="size-3.5" />
            </button>
          ) : (
            <span className="flex cursor-not-allowed items-center gap-1.5 rounded-full bg-muted px-3.5 py-1.5 text-muted-foreground" aria-disabled="true">
              Demo coming soon
            </span>
          )}
          {html ? (
            <button onClick={download} title="Security-scanned HTML file" className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 hover:bg-secondary">
              <Download className="size-3.5" /> Download HTML
            </button>
          ) : (
            <span className="flex cursor-not-allowed items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-muted-foreground" aria-disabled="true" title="HTML downloads are coming soon">
              <Download className="size-3.5" /> Download HTML · soon
            </span>
          )}
          <DesignSystemButton slug={entry.slug} name={entry.name} />
          <button
            onClick={() => toggle(entry.id)}
            className={`flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 hover:bg-secondary ${fav ? "text-heart" : ""}`}
          >
            <FavHeart fav={fav} className="size-3.5" /> {fav ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      <div className="mt-6 flex gap-1 lg:hidden">
        {(["demo", "prompt"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm capitalize ${tab === t ? "bg-primary text-primary-foreground" : "border border-border"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl bg-tray p-2 lg:grid lg:grid-cols-[1.45fr_1fr] lg:gap-2">
        <section className={`${tab === "demo" ? "flex" : "hidden"} flex-col rounded-2xl bg-card lg:flex`}>
          <div className="flex items-center gap-1.5 border-b border-border/70 px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="ml-3 truncate font-mono text-[11px] text-muted-foreground">{html ? `/sites/${entry.slug}/live-demo · security scanned` : entry.demo_url ?? "demo coming soon"}</span>
            {(html || hasDemo) && (
              <div className="ml-auto flex shrink-0 items-center gap-2 pl-3">
                {html && <ThemeToggle compact value={theme} onChange={setTheme} singleTheme={!supportsPreviewThemes(html)} />}
                {hasDemo && <div className="hidden sm:block"><DeviceSwitcher value={device} onChange={setDevice} /></div>}
              </div>
            )}
            {hasDemo && (
              <button onClick={openDemo} className="ml-3 shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" aria-label="Open demo in a new tab">
                Open demo <ArrowUpRight className="size-3.5" />
              </button>
            )}
          </div>
          {contentLoading ? (
            <div className="p-2">
              <div className="skeleton-art skeleton-palette-1 relative h-[604px] w-full overflow-hidden rounded-xl bg-tray">
                <div className="skeleton-cloud skeleton-cloud-first" />
                <div className="skeleton-cloud skeleton-cloud-second" />
              </div>
            </div>
          ) : html ? (
            <DeviceFrame device={device}><iframe
              ref={frameRef}
              onLoad={onLoad}
              srcDoc={withTheme(linkGuardHtml(device === "fold" ? foldablePreviewHtml(html) : html))}
              title={`${entry.name} demo`}
              className={`w-full flex-1 bg-card ${device === "desktop" ? "min-h-[620px] rounded-b-2xl" : "h-full"}`}
              sandbox="allow-scripts"
              referrerPolicy="no-referrer"
            /></DeviceFrame>
          ) : entry.demo_url ? (
            <DeviceFrame device={device}><iframe
              src={entry.demo_url}
              title={`${entry.name} demo`}
              className={`w-full flex-1 bg-card ${device === "desktop" ? "min-h-[620px] rounded-b-2xl" : "h-full"}`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              loading="lazy"
            /></DeviceFrame>
          ) : (
            <div className="p-3">
              <OrbThumb hue={entry.hue} name={entry.name} thumbnailUrl={entry.thumbnail_url} />
              <p className="label-mono py-4 text-center text-muted-foreground">Live demo not published yet</p>
            </div>
          )}
        </section>

        <aside className={`${tab === "prompt" ? "flex" : "hidden"} flex-col overflow-hidden rounded-2xl bg-card lg:flex`}>
          <div className="flex items-center justify-between border-b border-border/70 px-5 py-3">
            <span className="label-mono text-muted-foreground">Build prompt</span>
            <div className="flex items-center gap-2">
            <button onClick={openInLovable} disabled={!content?.prompt} title="Opens Lovable with this prompt filled in. Review it and press Send." className="flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 text-sm text-foreground hover:bg-secondary/70 disabled:opacity-50">
              Open in Lovable <ArrowUpRight className="size-3.5" />
            </button>
            <button onClick={copy} className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm text-primary-foreground hover:opacity-90">
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}
            </button>
            </div>
          </div>
          <p className="border-b border-border/70 px-5 py-2 text-xs text-muted-foreground">Works with Lovable and any AI builder: paste it into a new project or one you're already building.</p>
          {contentLoading ? (
            <div className="flex-1 space-y-3 p-5" aria-hidden="true">
              <div className="h-3.5 w-11/12 rounded bg-secondary" />
              <div className="h-3.5 w-full rounded bg-secondary" />
              <div className="h-3.5 w-4/5 rounded bg-secondary" />
              <div className="h-3.5 w-11/12 rounded bg-secondary" />
              <div className="h-3.5 w-2/3 rounded bg-secondary" />
              <div className="h-3.5 w-5/6 rounded bg-secondary" />
              <div className="h-3.5 w-3/4 rounded bg-secondary" />
            </div>
          ) : (
            <pre className="max-h-[620px] flex-1 overflow-auto whitespace-pre-wrap p-5 font-mono text-[13px] leading-relaxed text-foreground/80">{content?.prompt ?? ""}</pre>
          )}
        </aside>
      </div>
    </main>
  );
}
