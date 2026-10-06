import { createFileRoute } from "@tanstack/react-router";
import { FilteredPage } from "@/components/FilteredPage";
import { slugify } from "@/lib/entries";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} recreations — Promptfolio` },
      { name: "description", content: `AI-recreated ${params.slug} interfaces with live demos and build prompts.` },
      { property: "og:title", content: `${params.slug} recreations — Promptfolio` },
      { property: "og:description", content: `Browse ${params.slug} sites rebuilt by AI.` },
    ],
  }),
  component: () => {
    const { slug } = Route.useParams();
    return <FilteredPage label="Category" title={slug.replace(/-/g, " ")} filter={(e) => slugify(e.category) === slug} />;
  },
});
