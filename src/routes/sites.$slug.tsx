import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowUpRight, Copy, Check, Heart, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { entryQuery, slugify } from "@/lib/entries";
import { useFavorites } from "@/hooks/use-favorites";
import { OrbThumb } from "@/components/Orb";

export const Route = createFileRoute("/sites/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `How to build ${params.slug} with AI — Promptfolio` },
      { name: "description", content: `Live AI recreation of ${params.slug} plus the full prompt used to build it.` },
      { property: "og:title", content: `How to build ${params.slug} with AI — Promptfolio` },
      { property: "og:description", content: `Try the live demo and copy the build prompt for ${params.slug}.` },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { slug } = Route.useParams();
  const { data: entry, isLoading } = useQuery(entryQuery(slug));
  const { isFav, toggle } = useFavorites();
  const [tab, setTab] = useState<"demo" | "prompt">("demo");
  const [copied, setCopied] = useState(false);

  if (isLoading) return <p className="py-32 text-center text-muted-foreground">Loading…</p>;
  if (!entry)
    return (
      <main className="py-32 text-center">
        <h1 className="font-serif text-4xl">Not found</h1>
        <Link to="/" className="mt-4 inline-block text-muted-foreground underline">Back to browse</Link>
      </main>
    );

  const copy = async () => {
    await navigator.clipboard.writeText(entry.prompt);
    setCopied(true);
    toast.success("Prompt copied");
    setTimeout(() => setCopied(false), 1800);
  };
  const fav = isFav(entry.id);

  return (
    <main className="mx-auto max-w-6xl px-6 pt-12">
      <Link to="/" className="label-mono text-muted-foreground hover:text-foreground">← All recreations</Link>
      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <Link to="/category/$slug" params={{ slug: slugify(entry.category) }} className="label-mono text-muted-foreground hover:text-foreground">
            {entry.category}
          </Link>
          <h1 className="mt-2 font-serif text-5xl tracking-tight">{entry.name}</h1>
          <p className="mt-2 text-muted-foreground">{entry.description}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm">
          {entry.original_url && (
            <a href={entry.original_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full border border-border bg-card px-3.5 py-1.5 hover:bg-secondary">
              Original <ArrowUpRight className="size-3.5" />
            </a>
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
        <section className={`${tab === "demo" ? "block" : "hidden"} rounded-2xl bg-card lg:block`}>
          <div className="flex items-center gap-1.5 border-b border-border/70 px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="ml-3 truncate font-mono text-[11px] text-muted-foreground">{entry.demo_url ?? "demo coming soon"}</span>
            {entry.demo_url && (
              <a href={entry.demo_url} target="_blank" rel="noreferrer" className="ml-auto text-muted-foreground hover:text-foreground" aria-label="Open full screen">
                <Maximize2 className="size-3.5" />
              </a>
            )}
          </div>
          {entry.demo_url ? (
            <iframe
              src={entry.demo_url}
              title={`${entry.name} demo`}
              className="h-[620px] w-full rounded-b-2xl bg-card"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              loading="lazy"
            />
          ) : (
            <div className="p-3">
              <OrbThumb hue={entry.hue} name={entry.name} />
              <p className="label-mono py-4 text-center text-muted-foreground">Live demo not published yet</p>
            </div>
          )}
        </section>

        <aside className={`${tab === "prompt" ? "flex" : "hidden"} flex-col rounded-2xl bg-card lg:flex`}>
          <div className="flex items-center justify-between border-b border-border/70 px-5 py-3">
            <span className="label-mono text-muted-foreground">Build prompt</span>
            <button onClick={copy} className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm text-primary-foreground hover:opacity-90">
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="max-h-[620px] flex-1 overflow-auto whitespace-pre-wrap p-5 font-mono text-[13px] leading-relaxed text-foreground/80">{entry.prompt}</pre>
        </aside>
      </div>
    </main>
  );
}
