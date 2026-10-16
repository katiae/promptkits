import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Orb } from "@/components/Orb";

type OAuthResult = { data: { redirect_url?: string; redirect_to?: string; client?: { name?: string } } | null; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  staticData: { sitemap: false },
  // SSR has no localStorage session and would redirect signed-in users.
  ssr: false,
  head: () => ({ meta: [{ title: "Connect an assistant — Promptkits" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s['authorization_id'] === "string" ? s['authorization_id'] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth", search: { next: location.pathname + location.searchStr } });
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(id);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md px-6 py-28 text-center">
      <h1 className="font-serif text-3xl">This request couldn't load</h1>
      <p className="mt-3 text-muted-foreground">{error instanceof Error ? error.message : String(error)}. Try connecting again from your assistant.</p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = details?.client?.name ?? "An assistant";

  async function decide(approve: boolean) {
    setBusy(true); setError(null);
    const { data, error } = approve ? await oauth().approveAuthorization(authorization_id) : await oauth().denyAuthorization(authorization_id);
    if (error) { setBusy(false); setError(error.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("No redirect was returned. Please try again."); return; }
    window.location.href = target;
  }

  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-6 py-28 text-center">
      <Orb hue={150} size={48} />
      <h1 className="mt-6 font-serif text-4xl tracking-tight">Connect {name}</h1>
      <p className="mt-3 text-muted-foreground">{name} will be able to browse templates, read their build prompts and see your saved templates, as you.</p>
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      <div className="mt-8 flex w-full gap-2">
        <button disabled={busy} onClick={() => decide(false)} className="flex-1 rounded-full border border-border px-5 py-3 hover:bg-secondary disabled:opacity-60">Deny</button>
        <button disabled={busy} onClick={() => decide(true)} className="flex-1 rounded-full bg-primary px-5 py-3 text-primary-foreground hover:opacity-90 disabled:opacity-60">{busy ? "Working…" : "Approve"}</button>
      </div>
    </main>
  );
}
