import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

export function FavoriteButton({ productId, className, showLabel = false }: { productId: number; className?: string; showLabel?: boolean }) {
  const supabase = getSupabase();
  const [userId, setUserId] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    const sync = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      const id = data.session?.user.id ?? null;
      setUserId(id);
      if (!id) {
        setFavorite(false);
        return;
      }
      const { data: row } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", id)
        .eq("product_id", productId)
        .maybeSingle();
      if (active) setFavorite(Boolean(row));
    };

    void sync();
    const { data } = supabase.auth.onAuthStateChange(() => void sync());
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [productId, supabase]);

  const toggle = async () => {
    if (!supabase || !userId) {
      window.dispatchEvent(new Event("joshua-scents:open-account"));
      return;
    }
    setBusy(true);
    const result = favorite
      ? await supabase.from("favorites").delete().eq("user_id", userId).eq("product_id", productId)
      : await supabase.from("favorites").insert({ user_id: userId, product_id: productId });
    if (!result.error) setFavorite(!favorite);
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={busy}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={favorite}
      title={userId ? (favorite ? "Remove from favorites" : "Add to favorites") : "Sign in to save favorites"}
      className={className ?? `flex w-14 shrink-0 items-center justify-center rounded-[5px] border border-[#171717] transition-colors disabled:opacity-50 ${favorite ? "bg-[#171717] text-white" : "bg-transparent text-[#171717] hover:bg-[#171717] hover:text-white"}`}
    >
      <Heart size={19} fill={favorite ? "currentColor" : "none"} />
      {showLabel && <span>{favorite ? "Saved to wishlist" : "Save to wishlist"}</span>}
    </button>
  );
}
