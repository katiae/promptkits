import { createFileRoute } from "@tanstack/react-router";
import { FilteredPage } from "@/components/FilteredPage";
import { slugify } from "@/lib/entries";

export const Route = createFileRoute("/category/$slug")({
  staticData: { sitemap: false },
  head: ({ params }) => {
    const nice = params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
    meta: [
      { title: `${nice} templates — Promptfolio` },
      { name: "description", content: `${nice} interface templates with live demos and complete AI build prompts.` },
      { property: "og:title", content: `${nice} templates — Promptfolio` },
      { property: "og:description", content: `Browse ${nice} templates to build with AI.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
  },
  component: () => {
    const { slug } = Route.useParams();
    return <FilteredPage label="Category" title={slug.replace(/-/g, " ")} filter={(e) => slugify(e.category) === slug} />;
  },
});
