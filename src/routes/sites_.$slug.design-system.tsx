import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Download, ArrowUpRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { withTheme, type DsTheme } from "@/lib/ds-theme";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getDesignSystemGuidelines, getDesignSystemFiles } from "@/lib/design-system.functions";
import { DesignSystemTeaser } from "@/components/DesignSystemButton";

export const Route = createFileRoute("/sites_/$slug/design-system")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} design system — Promptfolio` },
      { name: "description", content: `Guidelines, tokens and components for the ${params.slug} template, ready for GitHub and Storybook.` },
      { property: "og:title", content: `${params.slug} design system — Promptfolio` },
      { property: "og:description", content: "Guidelines, design tokens and a complete component kit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DesignSystemPage,
});

function DesignSystemPage() {
  const { slug } = Route.useParams();
  const { user, loading } = useAuth();
  const fetchGuide = useServerFn(getDesignSystemGuidelines);
  const fetchFiles = useServerFn(getDesignSystemFiles);
  const [busy, setBusy] = useState(false);
  const [theme, setTheme] = useState<DsTheme>("dark");
  const { data, isLoading } = useQuery({
    queryKey: ["design-system", slug, user?.id],
    queryFn: () => fetchGuide({ data: { slug } }),
    enabled: !!user,
  });
  const name = slug === "midnight-cadence" ? "Halyard" : slug;

  const download = async () => {
    setBusy(true);
    try {
      const { files } = await fetchFiles({ data: { slug } });
      if (!files) throw new Error("missing");
      const { zipSync, strToU8 } = await import("fflate");
      const tree: Record<string, Uint8Array> = {};
      for (const [p, c] of Object.entries(files)) tree[`${slug}-design-system/${p}`] = strToU8(c);
      const blob = new Blob([zipSync(tree, { level: 6 }) as BlobPart], { type: "application/zip" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${slug}-design-system.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1600px] px-6 pt-12">
      <Link to="/sites/$slug" params={{ slug }} className="label-mono text-muted-foreground hover:text-foreground">← Back to template</Link>
      {!loading && !user ? (
        <div className="mx-auto mt-16 max-w-md rounded-3xl bg-card p-8"><DesignSystemTeaser slug={slug} name={name} /></div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-end gap-4">
            <div>
              <h1 className="font-serif text-5xl tracking-tight">{name} design system</h1>
              <p className="mt-2 text-muted-foreground">Foundations and a complete component kit to grow your product beyond the template.</p>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
            <ThemeToggle value={theme} onChange={setTheme} />
            <a href={`/sites/${slug}/design-system/preview`} target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-full bg-card px-4 py-2 text-sm hover:bg-tray">
              Open in new tab <ArrowUpRight className="size-3.5" />
            </a>
            <button onClick={download} disabled={busy || !data?.html} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-60">
              <Download className="size-3.5" /> {busy ? "Preparing…" : "Download for GitHub & Storybook"}
            </button>
            </div>
          </div>
          <div className="mt-6 overflow-hidden rounded-3xl bg-tray p-2">
            {isLoading || loading ? (
              <div className="skeleton-art skeleton-palette-1 relative h-[80vh] overflow-hidden rounded-2xl bg-card" aria-busy="true">
                <div className="skeleton-cloud skeleton-cloud-first" /><div className="skeleton-cloud skeleton-cloud-second" />
              </div>
            ) : data?.html ? (
              <iframe key={theme} srcDoc={withTheme(data.html, theme)} title={`${name} design system guidelines`} sandbox="allow-scripts" className="h-[80vh] w-full rounded-2xl bg-card" />
            ) : (
              <p className="label-mono py-24 text-center text-muted-foreground">No design system for this template yet</p>
            )}
          </div>
        </>
      )}
    </main>
  );
}
