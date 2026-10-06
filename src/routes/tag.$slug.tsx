import { createFileRoute } from "@tanstack/react-router";
import { FilteredPage } from "@/components/FilteredPage";

export const Route = createFileRoute("/tag/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `#${params.slug} — Promptfolio` },
      { name: "description", content: `Recreations tagged ${params.slug}, with live demos and prompts.` },
      { property: "og:title", content: `#${params.slug} — Promptfolio` },
      { property: "og:description", content: `AI recreations tagged ${params.slug}.` },
    ],
  }),
  component: () => {
    const { slug } = Route.useParams();
    return <FilteredPage label="Tag" title={`#${slug}`} filter={(e) => e.tags.includes(slug)} />;
  },
});
