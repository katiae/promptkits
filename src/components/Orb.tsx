export function Orb({ hue, size = 40, className = "" }: { hue: number; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`orb inline-block shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 30%, oklch(0.97 0.03 ${hue}), oklch(0.8 0.1 ${hue}) 45%, oklch(0.62 0.12 ${(hue + 40) % 360}) 100%)`,
      }}
    />
  );
}

export function OrbThumb({ hue, name }: { hue: number; name: string }) {
  return (
    <div className="relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-xl bg-tray">
      <div
        className="absolute -left-6 -top-8 size-40 rounded-full opacity-70 blur-2xl"
        style={{ background: `oklch(0.85 0.09 ${hue})` }}
      />
      <div
        className="absolute -bottom-10 right-0 size-44 rounded-full opacity-60 blur-2xl"
        style={{ background: `oklch(0.86 0.07 ${(hue + 120) % 360})` }}
      />
      <span className="relative font-serif text-3xl text-foreground/80">{name}</span>
    </div>
  );
}
