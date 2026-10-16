import { createFileRoute } from "@tanstack/react-router";
import { FilteredPage } from "@/components/FilteredPage";

export const Route = createFileRoute("/tag/$slug")({
  staticData: { sitemap: false },
  head: ({ params }) => {
    const nice = params.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return {
    meta: [
      { title: `#${nice} — Promptfolio` },
      { name: "description", content: `Interface templates tagged ${nice}, with live demos and build prompts.` },
      { property: "og:title", content: `#${nice} — Promptfolio` },
      { property: "og:description", content: `AI interface templates tagged ${nice}.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
  },
  component: () => {
    const { slug } = Route.useParams();
    return <FilteredPage label="Tag" title={`#${slug}`} filter={(e) => e.tags.includes(slug)} />;
  },
});
