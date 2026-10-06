import { useEffect, useRef, useState, type ReactNode } from "react";
import { Monitor, Tablet, Smartphone, BookOpen, Square } from "lucide-react";

export type Device = "desktop" | "tablet" | "phone" | "fold" | "flip";

export const DEVICES: { id: Device; label: string; icon: typeof Monitor; w?: number; h?: number }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor },
  { id: "tablet", label: "Tablet", icon: Tablet, w: 820, h: 1180 },
  { id: "fold", label: "Foldable", icon: BookOpen, w: 673, h: 841 },
  { id: "phone", label: "Phone", icon: Smartphone, w: 390, h: 844 },
  { id: "flip", label: "Flip phone", icon: Square, w: 360, h: 374 },
];

export function DeviceSwitcher({ value, onChange }: { value: Device; onChange: (d: Device) => void }) {
  const activeIndex = DEVICES.findIndex((d) => d.id === value);
  const STEP = 30; // 28px button + 2px gap

  return (
    <div role="radiogroup" aria-label="Preview size" className="relative flex shrink-0 items-center gap-0.5 rounded-full bg-tray p-0.5">
      {/* Sliding active pill, like the iOS segmented control */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0.5 top-0.5 size-7 rounded-full bg-card shadow-sm transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ transform: `translateX(${activeIndex * STEP}px)` }}
      />
      {DEVICES.map(({ id, label, icon: Icon }) => (
        <div key={id} className="group relative">
          <button
            role="radio"
            aria-checked={value === id}
            aria-label={label}
            onClick={() => onChange(id)}
            className={`relative z-10 grid size-7 place-items-center rounded-full transition-colors ${value === id ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Icon className="size-3.5" />
          </button>
          <span
            role="tooltip"
            className="label-mono pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md bg-primary px-2 py-1 text-[10px] text-primary-foreground opacity-0 shadow-sm transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100"
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Renders children at the device's real size, scaled down to fit the available area. */
export function DeviceFrame({ device, children }: { device: Device; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const spec = DEVICES.find((d) => d.id === device)!;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => e && setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!spec.w || !spec.h) {
    return <div ref={ref} className="flex min-h-[620px] w-full flex-1 flex-col">{children}</div>;
  }
  const pad = 24;
  const scale = box.w ? Math.min(1, (box.w - pad) / spec.w, (box.h - pad) / spec.h) : 0;

  return (
    <div ref={ref} className="relative flex min-h-[620px] w-full flex-1 items-center justify-center overflow-hidden rounded-b-2xl bg-tray/60">
      <div style={{ width: spec.w * scale, height: spec.h * scale }} className="transition-[width,height] duration-300">
        <div
          style={{ width: spec.w, height: spec.h, transform: `scale(${scale})`, transformOrigin: "top left" }}
          className="flex flex-col overflow-hidden rounded-[28px] bg-card shadow-lg ring-1 ring-border"
        >
          {children}
        </div>
      </div>
      <span className="label-mono absolute bottom-2 right-3 text-[10px] text-muted-foreground">
        {spec.label} · {spec.w}×{spec.h}
      </span>
    </div>
  );
}
