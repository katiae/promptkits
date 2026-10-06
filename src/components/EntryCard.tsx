import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { Entry } from "@/lib/entries";
import { OrbThumb } from "./Orb";

export function EntryCard({ entry, fav, onFav }: { entry: Entry; fav: boolean; onFav: () => void }) {
  return (
    <article className="group relative flex flex-col rounded-2xl bg-card p-2.5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-28px_oklch(0.2_0.01_70/0.35)]">
      <OrbThumb hue={entry.hue} name={entry.name} thumbnailUrl={entry.thumbnail_url} />
      <div className="flex items-start justify-between gap-3 px-2.5 pt-4">
        <div>
          <Link
            to="/sites/$slug"
            params={{ slug: entry.slug }}
            className="font-serif text-xl leading-tight after:absolute after:inset-0 after:rounded-2xl after:content-['']"
          >
            {entry.name}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>
        </div>
        <button
          onClick={onFav}
          aria-label={fav ? "Remove from saved" : "Save"}
          className={`relative z-10 rounded-full p-1.5 transition hover:bg-secondary ${fav ? "text-heart" : "text-muted-foreground"}`}
        >
          <Heart className="size-4" fill={fav ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 px-2.5 pb-2 pt-3">
        {entry.tags.map((t) => (
          <Link
            key={t}
            to="/tag/$slug"
            params={{ slug: t }}
            className="relative z-10 rounded-full bg-secondary px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground hover:text-foreground"
          >
            {t}
          </Link>
        ))}
      </div>
    </article>
  );
}
