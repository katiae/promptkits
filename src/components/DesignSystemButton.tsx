import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Layers, Lock } from "lucide-react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { listDesignSystems } from "@/lib/design-system.functions";

export async function signInWithGoogle(returnPath: string) {
  const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}${returnPath}` });
  if (result.error) toast.error("Sign in failed. Please try again.");
}

export function DesignSystemTeaser({ slug, name }: { slug: string; name: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="text-center">
      <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-secondary text-primary"><Lock className="size-4" /></div>
      <h2 className="mt-4 font-serif text-3xl tracking-tight">{name} design system</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Colours, type, spacing, motion and a full component kit — buttons, inputs, checkboxes, switches, date pickers and more — plus files ready for GitHub and Storybook.
      </p>
      <ul className="label-mono mx-auto mt-5 grid max-w-xs gap-1.5 text-left text-muted-foreground">
        <li>· Guidelines page</li><li>· Design tokens (CSS + JSON)</li><li>· React components + stories</li>
      </ul>
      <button
        disabled={busy}
        onClick={async () => { setBusy(true); await signInWithGoogle(`/sites/${slug}/design-system`); setBusy(false); }}
        className="mt-6 w-full rounded-full bg-primary px-5 py-3 text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Opening Google…" : "Sign in with Google to unlock"}
      </button>
      <p className="mt-3 text-xs text-muted-foreground">Free with an account.</p>
    </div>
  );
}

export function DesignSystemButton({ slug, name }: { slug: string; name: string }) {
  const list = useServerFn(listDesignSystems);
  const { data } = useQuery({ queryKey: ["design-systems"], queryFn: () => list(), staleTime: 600_000 });
  if (!data?.includes(slug)) return null;
  const cls = "flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 hover:bg-secondary";
  // Preview is open to everyone; signing in only unlocks the downloads.
  return <Link to="/sites/$slug/design-system" params={{ slug }} className={cls}><Layers className="size-3.5" /> Design system</Link>;
}
