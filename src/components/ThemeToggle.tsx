import { Moon, Sun } from "lucide-react";
import type { DsTheme } from "@/lib/ds-theme";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ value, onChange, singleTheme = false, compact = false }: { value: DsTheme; onChange: (t: DsTheme) => void; singleTheme?: boolean; compact?: boolean }) {
  const opts = [{ t: "dark" as const, Icon: Moon, label: "Dark" }, { t: "light" as const, Icon: Sun, label: "Light" }];
  const w = compact ? 62 : 76;
  const step = compact ? 64 : 78;
  const h = compact ? "h-6" : "h-8";
  return (
    <div role="radiogroup" aria-label="Theme" className="relative flex gap-0.5 rounded-full bg-tray p-0.5">
      <div aria-hidden className={`absolute left-0.5 top-0.5 rounded-full bg-card shadow-sm transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${h}`} style={{ width: w, transform: `translateX(${value === "light" ? step : 0}px)` }} />
      {opts.map(({ t, Icon, label }) => {
        const unavailable = singleTheme && value !== t;
        return (
          <div key={t} className="group relative">
            <Button variant="ghost" role="radio" aria-checked={value === t} aria-disabled={unavailable || undefined}
              title={unavailable ? "Coming soon" : undefined}
              onClick={() => { if (!unavailable) onChange(t); }}
              className={`relative z-10 flex items-center justify-center gap-1.5 rounded-full px-0 font-normal transition-colors ${h} ${compact ? "w-[62px] text-xs" : "w-[76px] text-sm"} ${unavailable ? "cursor-not-allowed text-muted-foreground/45" : value === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className={compact ? "size-3" : "size-3.5"} /> {label}
            </Button>
            {unavailable && (
              <span role="tooltip" className="label-mono pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-primary px-2 py-1 text-[10px] text-primary-foreground opacity-0 shadow-sm transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                Coming soon
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
