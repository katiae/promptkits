import { createFileRoute } from "@tanstack/react-router";
import { FilteredPage } from "@/components/FilteredPage";
import { slugify } from "@/lib/entries";

export const Route = createFileRoute("/category/$slug")({
  staticData: { sitemap: false },
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} templates — Promptfolio` },
      { name: "description", content: `${params.slug} interface templates with live demos and complete AI build prompts.` },
      { property: "og:title", content: `${params.slug} templates — Promptfolio` },
      { property: "og:description", content: `Browse ${params.slug} templates to build with AI.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => {
    const { slug } = Route.useParams();
    return <FilteredPage label="Category" title={slug.replace(/-/g, " ")} filter={(e) => slugify(e.category) === slug} />;
  },
});
