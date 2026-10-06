import { Heart } from "lucide-react";

/**
 * Heart with a YouTube-Shorts-style pop: springy scale-up plus a soft
 * expanding ring, replayed each time `fav` flips on (via key remount).
 */
export function FavHeart({ fav, className }: { fav: boolean; className?: string }) {
  return (
    <span key={String(fav)} className={`relative inline-flex ${fav ? "heart-pop" : ""}`}>
      <Heart className={className} fill={fav ? "currentColor" : "none"} />
      {fav && <span aria-hidden="true" className="heart-ring" />}
    </span>
  );
}
