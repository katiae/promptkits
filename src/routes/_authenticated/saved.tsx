import { createFileRoute } from "@tanstack/react-router";
import { FilteredPage } from "@/components/FilteredPage";
import { useFavorites } from "@/hooks/use-favorites";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({
    meta: [
      { title: "Saved — Promptfolio" },
      { name: "description", content: "Your saved AI recreations and prompts." },
      { property: "og:title", content: "Saved — Promptfolio" },
      { property: "og:description", content: "Your favourite recreations." },
    ],
  }),
  component: Saved,
});

function Saved() {
  const { ids } = useFavorites();
  return <FilteredPage label="Your collection" title="Saved" filter={(e) => ids.includes(e.id)} />;
}
