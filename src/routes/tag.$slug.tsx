import { createFileRoute } from "@tanstack/react-router";
import { FilteredPage } from "@/components/FilteredPage";

export const Route = createFileRoute("/tag/$slug")({
  staticData: { sitemap: false },
  head: ({ params }) => ({
    meta: [
      { title: `#${params.slug} — Promptfolio` },
      { name: "description", content: `Interface templates tagged ${params.slug}, with live demos and build prompts.` },
      { property: "og:title", content: `#${params.slug} — Promptfolio` },
      { property: "og:description", content: `AI interface templates tagged ${params.slug}.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => {
    const { slug } = Route.useParams();
    return <FilteredPage label="Tag" title={`#${slug}`} filter={(e) => e.tags.includes(slug)} />;
  },
});
