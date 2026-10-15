import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, ArrowUpRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { withTheme, postTheme, type DsTheme } from "@/lib/ds-theme";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getDesignSystemGuidelines, getDesignSystemFiles } from "@/lib/design-system.functions";
import { signInWithGoogle } from "@/components/DesignSystemButton";
import { IMPORT_META } from "@/lib/design-system-import";
import { track } from "@/lib/analytics";

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
  const { user } = useAuth();
  const fetchGuide = useServerFn(getDesignSystemGuidelines);
  const fetchFiles = useServerFn(getDesignSystemFiles);
  const [busy, setBusy] = useState(false);
  const [theme, setTheme] = useState<DsTheme>("dark");
  const frameRef = useRef<HTMLIFrameElement>(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;
  useEffect(() => { postTheme(frameRef.current, theme); }, [theme]);
  const { data, isLoading } = useQuery({
    queryKey: ["design-system", slug],
    queryFn: () => fetchGuide({ data: { slug } }),
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const srcDoc = useMemo(() => (data?.html ? withTheme(data.html, themeRef.current) : ""), [data?.html]);
  const name = slug === "midnight-cadence" ? "Halyard" : slug;

  const download = async () => {
    setBusy(true);
    try {
      const { files } = await fetchFiles({ data: { slug } });
      if (!files) throw new Error("missing");
      const { zipSync, strToU8 } = await import("fflate");
      const tree: Record<string, Uint8Array> = {};
      const binaryPaths = new Set<string>(files[IMPORT_META] ? JSON.parse(files[IMPORT_META]).binaryPaths : []);
      for (const [p, c] of Object.entries(files)) {
        if (p === IMPORT_META) continue;
        const bytes = binaryPaths.has(p) ? Uint8Array.from(atob(c), (v) => v.charCodeAt(0)) : strToU8(c);
        // Split into two clear folders: guidelines (web view) and ui (Storybook kit)
        const guides = p.match(/^guidelines-source\/(?:[^/]+\/)?(.*)$/i);
        if (guides) tree[`${slug}-design-system/guidelines/${guides[1]}`] = bytes;
        else tree[`${slug}-design-system/ui/${p}`] = bytes;
      }
      const blob = new Blob([zipSync(tree, { level: 6 }) as BlobPart], { type: "application/zip" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${slug}-design-system.zip`;
      a.click();
      track(slug, "download_design_system");
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
      <div className="mt-6 flex flex-wrap items-end gap-4">
            <div>
              <h1 className="font-serif text-5xl tracking-tight">{name} design system</h1>
              <p className="mt-2 text-muted-foreground">Foundations and a complete component kit to grow your product beyond the template.</p>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
            <ThemeToggle value={theme} onChange={setTheme} />
            <a href={`/sites/${slug}/design-system/preview`} target="_blank" rel="noopener" onClick={() => track(slug, "open_design_system_tab")} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90">
              Open in new tab <ArrowUpRight className="size-3.5" />
            </a>
            {user ? (
              <button onClick={download} disabled={busy || !data?.html} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-secondary disabled:opacity-60">
                <Download className="size-3.5" /> {busy ? "Preparing…" : "Download for GitHub & Storybook"}
              </button>
            ) : (
              <button onClick={() => signInWithGoogle(`/sites/${slug}/design-system`)} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-secondary">
                <Lock className="size-3.5" /> Sign in with Google to download
              </button>
            )}
            </div>
          </div>
          <div className="mt-6 overflow-hidden rounded-3xl bg-tray p-2">
            {isLoading || loading ? (
              <div className="skeleton-art skeleton-palette-1 relative h-[80vh] overflow-hidden rounded-2xl bg-card" aria-busy="true">
                <div className="skeleton-cloud skeleton-cloud-first" /><div className="skeleton-cloud skeleton-cloud-second" />
              </div>
            ) : data?.html ? (
              <iframe ref={frameRef} srcDoc={srcDoc} onLoad={() => postTheme(frameRef.current, themeRef.current)} title={`${name} design system guidelines`} sandbox="allow-scripts" className="h-[80vh] w-full rounded-2xl bg-card" />
            ) : (
              <p className="label-mono py-24 text-center text-muted-foreground">No design system for this template yet</p>
            )}
          </div>
        </>
      )}
    </main>
  );
}
