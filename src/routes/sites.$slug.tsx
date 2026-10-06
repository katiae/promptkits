import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowUpRight, Copy, Check, Heart, Download } from "lucide-react";
import { toast } from "sonner";
import { entryMetaQuery, entryContentQuery, slugify } from "@/lib/entries";
import { useFavorites } from "@/hooks/use-favorites";
import { OrbThumb } from "@/components/Orb";
import { buildReport } from "@/lib/security-scanner";

export const Route = createFileRoute("/sites/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} interface template — Promptfolio` },
      { name: "description", content: `Try the ${params.slug} interface template and copy its complete AI build prompt.` },
      { property: "og:title", content: `${params.slug} interface template — Promptfolio` },
      { property: "og:description", content: `Open the live template and copy its complete AI build prompt.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
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
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-8 w-28 rounded-full bg-muted" />
            <div className="h-8 w-36 rounded-full bg-secondary" />
            <div className="h-8 w-20 rounded-full bg-secondary" />
          </div>
        </div>
        <div className="mt-5 flex gap-1.5">
          <div className="h-5 w-16 rounded-full bg-secondary" />
          <div className="h-5 w-20 rounded-full bg-secondary" />
          <div className="h-5 w-14 rounded-full bg-secondary" />
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
    setCopied(true);
    toast.success("Prompt copied");
    setTimeout(() => setCopied(false), 1800);
  };
  const fav = isFav(entry.id);
  const html = content?.html_content && buildReport(content.html_content, "").ok ? content.html_content : null;
  const hasDemo = !!(html || entry.demo_url);
  const openDemo = () => {
    const url = html
      ? `${window.location.origin}/sites/${entry.slug}/live-demo`
      : entry.demo_url;
    if (url) window.open(url, "_blank", "noopener");
  };
  const download = () => {
    if (!html) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    a.download = `${entry.slug}.html`;
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
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm">
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
          <button
            onClick={() => toggle(entry.id)}
            className={`flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 hover:bg-secondary ${fav ? "text-heart" : ""}`}
          >
            <Heart className="size-3.5" fill={fav ? "currentColor" : "none"} /> {fav ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {entry.tags.map((t) => (
          <Link key={t} to="/tag/$slug" params={{ slug: t }} className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground hover:text-foreground">
            {t}
          </Link>
        ))}
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
            {hasDemo && (
              <button onClick={openDemo} className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" aria-label="Open demo in a new tab">
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
            <iframe
              srcDoc={html}
              title={`${entry.name} demo`}
              className="min-h-[620px] w-full flex-1 rounded-b-2xl bg-card"
              sandbox="allow-scripts"
              referrerPolicy="no-referrer"
            />
          ) : entry.demo_url ? (
            <iframe
              src={entry.demo_url}
              title={`${entry.name} demo`}
              className="min-h-[620px] w-full flex-1 rounded-b-2xl bg-card"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              loading="lazy"
            />
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
            <button onClick={copy} className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm text-primary-foreground hover:opacity-90">
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
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
