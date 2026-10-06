import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { entriesQuery, type Entry } from "@/lib/entries";
import { EntryGrid } from "./EntryGrid";

export function FilteredPage({ label, title, filter }: { label: string; title: string; filter: (e: Entry) => boolean }) {
  const { data = [], isLoading } = useQuery(entriesQuery());
  const list = data.filter(filter);
  return (
    <main className="mx-auto max-w-[1600px] px-6 pt-16">
      <Link to="/" className="label-mono text-muted-foreground hover:text-foreground">← All templates</Link>
      <p className="label-mono mt-8 text-muted-foreground">{label}</p>
      <h1 className="mt-2 font-serif text-5xl tracking-tight">{title}</h1>
      <div className="mt-10"><EntryGrid entries={list} loading={isLoading} /></div>
    </main>
  );
}
