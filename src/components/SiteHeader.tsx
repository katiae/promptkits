import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Orb } from "./Orb";

export function SiteHeader() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center gap-8 px-6 py-3.5">
        <Link to="/" className="flex items-center gap-2.5">
          <Orb hue={150} size={22} />
          <span className="font-serif text-xl tracking-tight">Promptfolio</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }} className="hover:text-foreground">
            Browse
          </Link>
          <Link to="/saved" activeProps={{ className: "text-foreground" }} className="hover:text-foreground">
            Saved
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {user ? (
            <>
              {user.email?.toLowerCase() === "hello@katiadejuan.com" && (
                <Link to="/admin" className="text-muted-foreground hover:text-foreground">
                  Admin
                </Link>
              )}
              <button onClick={signOut} className="rounded-full border border-border bg-card px-4 py-1.5 hover:bg-secondary">
                Sign out
              </button>
            </>
          ) : (
            <Link to="/auth" className="rounded-full bg-primary px-4 py-1.5 text-primary-foreground hover:opacity-90">
              Join for free
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
