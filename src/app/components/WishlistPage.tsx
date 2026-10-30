import { ArrowRight, Heart, RefreshCw } from "lucide-react";
import { useWishlist } from "../../lib/wishlist";
import { ShopProductCard, type StoreProduct } from "./StorefrontInterfaces";

export function WishlistPage({ products, onProduct, onShop, onOpenAccount }: { products: StoreProduct[]; onProduct: (product: StoreProduct) => void; onShop: () => void; onOpenAccount: () => void }) {
  const wishlist = useWishlist();
  const saved = wishlist.ids.map(id => products.find(product => product.id === id)).filter((product): product is StoreProduct => !!product);
  return <div className="wishlist-page"><div className="wishlist-shell"><header><div><p className="wishlist-eyebrow">A LITTLE MORE PERSONAL</p><h1>The ones you love.</h1><p>{wishlist.userId ? "Your saved fragrances, linked to your account." : "Saved on this browser. Sign in to bring them into your account."}</p></div><span className="wishlist-count"><Heart size={17} strokeWidth={1.1} />{saved.length} saved</span></header>
    {!wishlist.userId && <div className="wishlist-signin"><p>Your next signature can wait.<br /><span>Keep your discoveries together when you sign in.</span></p><button onClick={onOpenAccount}>Sign in to sync<ArrowRight size={16} /></button></div>}
    {wishlist.error && <div className="wishlist-feedback" role="status"><p>{wishlist.error}</p>{wishlist.userId && <button disabled={wishlist.busy} onClick={() => void wishlist.retry()}><RefreshCw size={14} />{wishlist.busy ? "Retrying…" : "Retry sync"}</button>}</div>}
    {!wishlist.ready ? <p className="wishlist-loading" role="status">Opening your wishlist…</p> : !saved.length ? <section className="wishlist-empty"><Heart size={37} strokeWidth={.8} /><p className="wishlist-eyebrow">ROOM FOR A NEW FAVOURITE</p><h2>Follow what draws you in.</h2><p>Tap the heart on a fragrance to save it here. You don't need an account to start.</p><button onClick={onShop}>Explore the collection<ArrowRight size={17} /></button></section> : <><div className="wishlist-grid">{saved.map(product => <ShopProductCard key={product.id} product={product} onOpen={() => onProduct(product)} />)}</div><p className="wishlist-footnote">Tap a filled heart to remove a fragrance. Your wishlist is not a reservation of stock.</p></>}
  </div></div>;
}
