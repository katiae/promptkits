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

export function OrbThumb({ hue, name, thumbnailUrl }: { hue: number; name: string; thumbnailUrl?: string | null }) {
  if (thumbnailUrl)
    return (
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-tray">
        <img
          src={thumbnailUrl}
          alt={`${name} template preview`}
          loading="lazy"
          className="size-full object-contain object-top transition duration-500 group-hover:scale-[1.02]"
        />
      </div>
    );
  return (
    <div className="relative grid aspect-[16/10] w-full place-items-center overflow-hidden rounded-xl bg-tray">
      <div
        className="absolute -left-6 -top-8 size-40 rounded-full opacity-70 blur-2xl"
        style={{ background: `oklch(0.85 0.09 ${hue})` }}
      />
      <div
        className="absolute -bottom-10 right-0 size-44 rounded-full opacity-60 blur-2xl"
        style={{ background: `oklch(0.86 0.07 ${(hue + 120) % 360})` }}
      />
      <span className="relative px-5 text-center font-serif text-3xl text-foreground/80">{name}</span>
    </div>
  );
}
