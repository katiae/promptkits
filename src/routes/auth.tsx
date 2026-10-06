import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { Orb } from "@/components/Orb";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Promptfolio" },
      { name: "description", content: "Sign in with Google to save your favourite recreations." },
      { property: "og:title", content: "Sign in — Promptfolio" },
      { property: "og:description", content: "Save favourite AI recreations and prompts." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/", replace: true });
  }, [user, navigate]);

  const signIn = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error("Sign in failed. Please try again.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-6 py-28 text-center">
      <Orb hue={150} size={48} />
      <h1 className="mt-6 font-serif text-4xl tracking-tight">Welcome to Promptfolio</h1>
      <p className="mt-3 text-muted-foreground">Sign in to save the recreations and prompts you love.</p>
      <button
        onClick={signIn}
        disabled={busy}
        className="mt-8 w-full rounded-full bg-primary px-5 py-3 text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Opening Google…" : "Continue with Google"}
      </button>
    </main>
  );
}
