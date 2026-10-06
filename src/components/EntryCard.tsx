import { Link } from "@tanstack/react-router";
import { Heart, ArrowRight } from "lucide-react";
import type { Entry } from "@/lib/entries";
import { OrbThumb } from "./Orb";

export function EntryCard({ entry, fav, onFav }: { entry: Entry; fav: boolean; onFav: () => void }) {
  return (
    <article className="group flex flex-col rounded-2xl border border-border/80 bg-card p-2.5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-28px_oklch(0.2_0.01_70/0.35)]">
      <Link to="/sites/$slug" params={{ slug: entry.slug }}>
        {entry.thumbnail_url ? (
          <img src={entry.thumbnail_url} alt={entry.name} className="aspect-[4/3] w-full rounded-xl object-cover" loading="lazy" />
        ) : (
          <OrbThumb hue={entry.hue} name={entry.name} />
        )}
      </Link>
      <div className="flex items-start justify-between gap-3 px-2.5 pt-4">
        <div>
          <Link to="/sites/$slug" params={{ slug: entry.slug }} className="font-serif text-xl leading-tight">
            {entry.name}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>
        </div>
        <button
          onClick={onFav}
          aria-label={fav ? "Remove from saved" : "Save"}
          className={`rounded-full p-1.5 transition hover:bg-secondary ${fav ? "text-heart" : "text-muted-foreground"}`}
        >
          <Heart className="size-4" fill={fav ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 px-2.5 py-3">
        {entry.tags.map((t) => (
          <Link
            key={t}
            to="/tag/$slug"
            params={{ slug: t }}
            className="rounded-full bg-secondary px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground hover:text-foreground"
          >
            {t}
          </Link>
        ))}
      </div>
      <div className="mt-auto flex items-center border-t border-border/70 px-2.5 pb-1 pt-3 text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <span className={`size-1.5 rounded-full ${entry.demo_url ? "bg-live" : "bg-border"}`} />
          <span className="label-mono">{entry.demo_url ? "Live demo" : "Prompt only"}</span>
        </span>
        <Link
          to="/sites/$slug"
          params={{ slug: entry.slug }}
          className="ml-auto flex items-center gap-1 text-muted-foreground group-hover:text-foreground"
        >
          View <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}
