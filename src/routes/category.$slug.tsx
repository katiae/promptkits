import { createFileRoute } from "@tanstack/react-router";
import { FilteredPage } from "@/components/FilteredPage";
import { slugify } from "@/lib/entries";
import { categoryIntro } from "@/lib/collection-intros";

export const Route = createFileRoute("/category/$slug")({
  staticData: { sitemap: false },
  head: ({ params }) => {
    const { heading, description } = categoryIntro(params.slug);
    return {
      meta: [
        { title: `${heading} with AI prompts | Promptfolio` },
        { name: "description", content: description },
        { property: "og:title", content: `${heading} | Promptfolio` },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `https://promptkits.dev/category/${params.slug}` }],
    };
  },
  component: () => {
    const { slug } = Route.useParams();
    const { heading, intro } = categoryIntro(slug);
    return <FilteredPage label="Category" title={heading} intro={intro} filter={(e) => slugify(e.category) === slug} />;
  },
});
