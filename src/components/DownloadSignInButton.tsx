
const PERKS = [
  "Design tokens, guidelines & React components as a ZIP",
  "Storybook-ready UI kit for your own app",
  "Push to GitHub or GitLab — coming soon",
];

export function DownloadSignInButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        aria-describedby="download-perks"
        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-secondary"
      >
        Join for free
      </button>
      <div
        role="tooltip"
        id="download-perks"
        className="pointer-events-none absolute right-0 top-full z-30 w-[17.5rem] translate-y-1 rounded-2xl border border-border bg-card p-3.5 text-left opacity-0 shadow-lg transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
      >
        <p className="label-mono text-muted-foreground">What you get</p>
        <ul className="mt-2 space-y-1.5 text-sm text-foreground">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-2 leading-snug">
              <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
              {perk}
            </li>
          ))}
        </ul>
        <p className="mt-2.5 text-xs text-muted-foreground">Free account. Google sign-in only.</p>
      </div>
    </div>
  );
}
