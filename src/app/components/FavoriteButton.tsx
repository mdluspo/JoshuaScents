import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";

export function FavoriteButton({ productId, className, showLabel = false }: { productId: number; className?: string; showLabel?: boolean }) {
  const wishlist = useWishlist();
  const favorite = wishlist.ids.includes(productId);
  return <button type="button" onClick={() => void wishlist.toggle(productId)} disabled={!wishlist.ready || wishlist.busy}
    aria-label={favorite ? "Remove from favorites" : "Add to favorites"} aria-pressed={favorite}
    title={wishlist.error || (favorite ? "Remove from wishlist" : wishlist.userId ? "Save to your account wishlist" : "Save to wishlist on this device")}
    className={className ?? `flex w-14 shrink-0 items-center justify-center rounded-[5px] border border-[#171717] transition-colors disabled:opacity-50 ${favorite ? "bg-[#171717] text-white" : "bg-transparent text-[#171717] hover:bg-[#171717] hover:text-white"}`}>
    <Heart size={19} fill={favorite ? "currentColor" : "none"} />{showLabel && <span>{favorite ? "Saved to wishlist" : "Save to wishlist"}</span>}
  </button>;
}
