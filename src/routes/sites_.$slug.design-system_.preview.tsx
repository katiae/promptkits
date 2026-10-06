import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getDesignSystemGuidelines } from "@/lib/design-system.functions";
import { DesignSystemTeaser } from "@/components/DesignSystemButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { withTheme, type DsTheme } from "@/lib/ds-theme";

export const Route = createFileRoute("/sites_/$slug/design-system_/preview")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} design system (full screen) — Promptfolio` },
      { name: "description", content: `Full-screen guidelines for the ${params.slug} design system.` },
      { property: "og:title", content: `${params.slug} design system — full screen` },
      { property: "og:description", content: "Full-screen design system guidelines, tokens and components." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FullScreen,
});

function FullScreen() {
  const { slug } = Route.useParams();
  const { user, loading } = useAuth();
  const fetchGuide = useServerFn(getDesignSystemGuidelines);
  const [theme, setTheme] = useState<DsTheme>("dark");
  const { data } = useQuery({ queryKey: ["design-system", slug, user?.id], queryFn: () => fetchGuide({ data: { slug } }), enabled: !!user });
  const name = slug === "midnight-cadence" ? "Halyard" : slug;

  if (!loading && !user) return <div className="mx-auto mt-24 max-w-md rounded-3xl bg-card p-8"><DesignSystemTeaser slug={slug} name={name} /></div>;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-4 px-4 py-2">
        <Link to="/sites/$slug/design-system" params={{ slug }} className="label-mono text-muted-foreground hover:text-foreground">← {name} design system</Link>
        <div className="ml-auto"><ThemeToggle value={theme} onChange={setTheme} /></div>
      </div>
      {data?.html ? (
        <iframe key={theme} srcDoc={withTheme(data.html, theme)} title={`${name} design system`} sandbox="allow-scripts" className="w-full flex-1 bg-card" />
      ) : (
        <div className="skeleton-art skeleton-palette-1 relative flex-1 overflow-hidden" aria-busy="true"><div className="skeleton-cloud skeleton-cloud-first" /><div className="skeleton-cloud skeleton-cloud-second" /></div>
      )}
    </div>
  );
}
