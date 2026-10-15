import { useState } from "react";
import { GitBranch, Github, Gitlab } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Coming-soon teaser: push template + design system files straight into a new GitHub/GitLab repo. */
export function GitPushSoon() {
  const [open, setOpen] = useState(false);
  const providers = [
    { name: "GitHub", Icon: Github },
    { name: "GitLab", Icon: Gitlab },
  ];
  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-secondary">
        <GitBranch className="size-3.5" /> Push to GitHub / GitLab
        <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">Soon</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Push straight to your repo</DialogTitle>
            <DialogDescription>
              Soon you'll link your GitHub or GitLab account, create a new project in one click, and have every file pushed into it — no ZIP to download or unpack.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {providers.map(({ name, Icon }) => (
              <div key={name} className="flex flex-col items-start gap-2 rounded-2xl bg-secondary p-4">
                <Icon className="size-5" />
                <span className="font-medium">{name}</span>
                <span className="label-mono text-muted-foreground">Coming soon</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => { toast.success("Thanks! We'll let you know when it's ready."); setOpen(false); }}
            className="mt-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
          >
            Notify me when it's ready
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
