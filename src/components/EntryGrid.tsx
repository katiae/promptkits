import type { Entry } from "@/lib/entries";
import { useFavorites } from "@/hooks/use-favorites";
import { EntryCard } from "./EntryCard";
import { EntrySkeleton } from "./EntrySkeleton";
import { useEffect, useState } from "react";

export function EntryGrid({ entries, empty = "Nothing here yet.", loading = false }: { entries: Entry[]; empty?: string; loading?: boolean }) {
  const { isFav, toggle } = useFavorites();
  const [showSkeleton, setShowSkeleton] = useState(loading);
  useEffect(() => {
    if (loading) {
      setShowSkeleton(true);
      return;
    }
    const timer = setTimeout(() => setShowSkeleton(false), 480);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <div className="template-grid-stage relative" aria-busy={loading}>
      {loading && <span role="status" className="sr-only">Loading templates</span>}
      {(loading || showSkeleton) && (
        <div className={`template-grid-placeholders grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 ${!loading ? "template-grid-placeholders-exit" : ""}`} aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => <EntrySkeleton key={index} index={index} />)}
        </div>
      )}
      {!loading && (
        <div className={showSkeleton ? "template-grid-reveal" : ""}>
          {entries.length ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {entries.map((e) => (
                <EntryCard key={e.id} entry={e} fav={isFav(e.id)} onFav={() => toggle(e.id)} />
              ))}
            </div>
          ) : <p className="py-16 text-center text-muted-foreground">{empty}</p>}
        </div>
      )}
    </div>
  );
}
