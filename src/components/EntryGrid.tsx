import type { Entry } from "@/lib/entries";
import { useFavorites } from "@/hooks/use-favorites";
import { EntryCard } from "./EntryCard";

export function EntryGrid({ entries, empty = "Nothing here yet." }: { entries: Entry[]; empty?: string }) {
  const { isFav, toggle } = useFavorites();
  if (!entries.length) return <p className="py-16 text-center text-muted-foreground">{empty}</p>;
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {entries.map((e) => (
        <EntryCard key={e.id} entry={e} fav={isFav(e.id)} onFav={() => toggle(e.id)} />
      ))}
    </div>
  );
}
