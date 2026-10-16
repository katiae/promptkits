import { createFileRoute } from "@tanstack/react-router";
import { FilteredPage } from "@/components/FilteredPage";
import { tagIntro } from "@/lib/collection-intros";

export const Route = createFileRoute("/tag/$slug")({
  staticData: { sitemap: false },
  head: ({ params }) => {
    const { heading, description } = tagIntro(params.slug);
    return {
      meta: [
        { title: `${heading} with AI prompts | Promptfolio` },
        { name: "description", content: description },
        { property: "og:title", content: `${heading} | Promptfolio` },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `https://promptkits.dev/tag/${params.slug}` }],
    };
  },
  component: () => {
    const { slug } = Route.useParams();
    const { heading, intro } = tagIntro(slug);
    return <FilteredPage label="Tag" title={heading} intro={intro} filter={(e) => e.tags.includes(slug)} />;
  },
});
