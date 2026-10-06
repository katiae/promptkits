import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { entriesQuery } from "@/lib/entries";
import { EntryGrid } from "@/components/EntryGrid";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Promptfolio — Famous interfaces, rebuilt from the prompt" },
      { name: "description", content: "A directory of well-known websites and apps recreated by AI. Try each live demo and copy the prompt that built it." },
      { property: "og:title", content: "Promptfolio — Famous interfaces, rebuilt from the prompt" },
      { property: "og:description", content: "Try live AI recreations of famous sites and copy the exact build prompt." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data = [], isLoading } = useQuery(entriesQuery());
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<"new" | "az">("new");

  const categories = useMemo(() => ["All", ...Array.from(new Set(data.map((e) => e.category))).sort()], [data]);
  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    let list = data.filter(
      (e) =>
        (cat === "All" || e.category === cat) &&
        (!term ||
          e.name.toLowerCase().includes(term) ||
          e.description.toLowerCase().includes(term) ||
          e.tags.some((t) => t.includes(term)) ||
          e.prompt.toLowerCase().includes(term)),
    );
    if (sort === "az") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [data, q, cat, sort]);

  return (
    <main>
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-20 text-center animate-fade-up">
        <h1 className="mx-auto mt-5 max-w-3xl text-balance font-serif text-5xl font-normal leading-[1.05] tracking-tight text-primary sm:text-6xl">
          Famous interfaces, rebuilt from the prompt.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-lg text-muted-foreground">
          See how well-known sites were recreated with AI, play with the live demo, then copy the exact prompt to build your own.
        </p>
      </section>

      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-center gap-2 border-y border-border/80 py-3.5">
          <div className="mr-2 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 sm:w-64">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search sites, tags, prompts"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1 text-sm transition ${
                cat === c ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "new" | "az")}
            className="label-mono ml-auto bg-transparent text-muted-foreground outline-none"
          >
            <option value="new">Newest</option>
            <option value="az">A–Z</option>
          </select>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-8">
        {isLoading ? <p className="py-16 text-center text-muted-foreground">Loading…</p> : <EntryGrid entries={filtered} empty="No matches. Try another search." />}
      </section>
    </main>
  );
}
