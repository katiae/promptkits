import { Moon, Sun } from "lucide-react";
import type { DsTheme } from "@/lib/ds-theme";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ value, onChange }: { value: DsTheme; onChange: (t: DsTheme) => void }) {
  const opts = [{ t: "dark" as const, Icon: Moon, label: "Dark" }, { t: "light" as const, Icon: Sun, label: "Light" }];
  return (
    <div role="radiogroup" aria-label="Theme" className="relative flex gap-0.5 rounded-full bg-tray p-0.5">
      <div aria-hidden className="absolute left-0.5 top-0.5 h-8 w-[76px] rounded-full bg-card shadow-sm transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]" style={{ transform: `translateX(${value === "light" ? 78 : 0}px)` }} />
      {opts.map(({ t, Icon, label }) => (
        <Button variant="ghost" key={t} role="radio" aria-checked={value === t} onClick={() => onChange(t)}
          className={`relative z-10 flex h-8 w-[76px] items-center justify-center gap-1.5 rounded-full px-0 text-sm font-normal transition-colors ${value === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          <Icon className="size-3.5" /> {label}
        </Button>
      ))}
    </div>
  );
}
