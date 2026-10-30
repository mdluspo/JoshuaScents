import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "motion/react";
import { ShoppingCart, Search, User, Menu, X, ChevronDown, ChevronUp, Star, Check, ArrowLeft, Plus, Minus, Package, Truck, Shield, Gift, Play, Pause, Heart } from "lucide-react";
import { AccountCenterDialog } from "@/app/components/AccountCenterDialog";
import { AdminPortal } from "@/app/components/AdminPortal";
import { WishlistPage } from "@/app/components/WishlistPage";
import { configureWishlistCatalog, useWishlist } from "@/lib/wishlist";
import { EditorialHome } from "@/app/components/EditorialHome";
import { DiscoveryCollection, DiscoveryDetail } from "@/app/components/DiscoveryExperience";
import { CollectionExperience } from "@/app/components/CollectionExperience";
import { HeaderSearch } from "@/app/components/HeaderSearch";
import { SearchExperience, ScentExperience, BestSellersExperience, DecantGuideExperience } from "@/app/components/FragranceExperiences";
import { catalogFromSearch, catalogUrl, EMPTY_CATALOG, normalizeCatalog, type CatalogState } from "@/lib/catalog";
import { AddressAutocomplete } from "@/app/components/AddressAutocomplete";
import { BagDrawer, BagPage, CheckoutInterface, ProductDetail, ShopProductCard, StoreActions } from "@/app/components/StorefrontInterfaces";
import { createCheckout, getDeliveryQuote } from "@/lib/api";
import { trackStoreEvent } from "@/lib/analytics";
import { getSupabase } from "@/lib/supabase";
import { FRAGRANCE_CATALOG } from "@/lib/fragrance-catalog";

// â”€â”€â”€ Real product images from imports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import imgBottle from "@/imports/HomePage-1/4e133df77e9b8b91ca178974f96996d69407baa3.png";
import imgFresh from "@/imports/HomePage-1/5448f702d066026555155dd6e9d258bf8b549271.png";
import imgTimber from "@/imports/HomePage-1/b5e4be725964c55e5bc90a6ac933655e9fabc067.png";
import imgVanilla from "@/imports/HomePage-1/0dc35c0a372a83c5bc1732635cbb5023145f72e4.png";
import imgAfterHours from "@/imports/HomePage-1/317b25d74938ff1d3193dec3f85a60d9fab21deb.png";
import imgProd1 from "@/imports/HomePage-1/910690fe86e0b700b11e2f8689a847f10ad8878a.png";
import imgProd2 from "@/imports/HomePage-1/03fe0c7f3499234efab093bf5442c043a6386b34.png";
import imgDiscoveryBg from "@/imports/HomePage-1/7452b194aae37fa8a6c9f878f11df616d71b5669.png";
import imgWhyBg from "@/imports/HomePage-1/why-joshua-scents.jpg";
import imgWhyLuxuryBg from "@/imports/HomePage-1/why-discovery-luxury-bg.png";
import imgCollProduct from "@/imports/Collections-1/2fead9763e6ed410e1c09e3afb4c82a010b439b5.png";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type Page = "home" | "collections" | "search" | "bestsellers" | "discovery" | "discoverySet" | "scentfinder" | "decantguide" | "faq" | "product" | "cart" | "checkout" | "confirmation" | "wishlist";

type AppHistoryState = {
  joshuaScents: true;
  page: Page;
  productId?: number;
  discoverySetId?: number | null;
  collectionFilters?: Partial<Filters>;
  searchQuery?: string;
  guard?: boolean;
};

type Filters = CatalogState;

interface Product {
  id: number;
  name: string;
  brand: string;
  family: string;
  category: string;
  notes: string;
  price: number;
  sizes: { label: string; price: number }[];
  description: string;
  img: string;
  bestSeller: boolean;
}

interface CartItem { product: Product; size: string; price: number; qty: number; }

// â”€â”€â”€ Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ALL_PRODUCTS: Product[] = FRAGRANCE_CATALOG.map(product => ({ ...product, img: imgCollProduct }));

configureWishlistCatalog(ALL_PRODUCTS.map(product => product.id));

const DISCOVERY_SETS = [
  { id: 1, name: "The Starter Collection", subtitle: "Five timeless fragrances to begin your journey.", count: 5, price: 990, tags: ["Fresh", "Woody", "Spicy"], productIds: [1, 2, 3, 4, 5] },
  { id: 2, name: "Wanderlust Collection", subtitle: "Bold scents inspired by distant places and open roads.", count: 3, price: 750, tags: ["Chypre", "Oriental", "Fresh"], productIds: [3, 6, 10] },
  { id: 3, name: "Velvet Underground", subtitle: "Dark, seductive, and unapologetically intense.", count: 4, price: 880, tags: ["Oud", "Woody", "Spicy"], productIds: [5, 6, 10, 11] },
  { id: 4, name: "Weekend Getaway", subtitle: "Light, effortless, perfect for every casual moment.", count: 4, price: 820, tags: ["Fresh", "Citrus", "Aquatic"], productIds: [1, 2, 4, 12] },
];

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function GoldBar() {
  return <div className="h-[2px] w-20 bg-[#AE9766] rounded-full" />;
}

function GlobalTexture() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60]"
      style={{
        opacity: 0.18,
        mixBlendMode: "multiply",
        backgroundImage:
          "radial-gradient(circle at 24% 18%, rgba(255,255,255,0.34), transparent 28%), radial-gradient(circle at 82% 76%, rgba(174,151,102,0.18), transparent 30%), repeating-linear-gradient(90deg, rgba(78,61,37,0.026) 0 1px, transparent 1px 54px), repeating-linear-gradient(0deg, rgba(78,61,37,0.018) 0 1px, transparent 1px 61px)",
        backgroundSize: "100% 100%, 100% 100%, auto, auto",
      }}
    />
  );
}

function cleanText(text: string) {
  return text.replaceAll("â€¢", "•").replaceAll("â€”", "-").replaceAll("HermÃ¨s", "Hermes");
}

function cleanNotes(notes: string) {
  return cleanText(notes);
}



function DarkBtn({ onClick, children, className = "", type = "button", disabled = false }: { onClick?: () => void; children: React.ReactNode; className?: string; type?: "button" | "submit"; disabled?: boolean }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`bg-[#1e1e1e] text-white font-['Cormorant_Garamond',serif] font-bold text-[15px] tracking-[0.12em] px-7 py-[11px] rounded-[5px] hover:bg-[#3d3d3d] transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${className}`}>
      {children}
    </button>
  );
}

// â”€â”€â”€ HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Header({ page, navigate, cartCount, onAccount }: { page: Page; navigate: (page: Page, data?: unknown) => void; cartCount: number; onAccount: () => void }) {
  const wishlist = useWishlist();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const links: { label: string; page: Page }[] = [{ label: "Home", page: "home" }, { label: "Collections", page: "collections" }, { label: "Discovery Sets", page: "discovery" }, { label: "Find Your Scent", page: "scentfinder" }, { label: "Best Sellers", page: "bestsellers" }, { label: "Decant Guide", page: "decantguide" }];
  return <header data-search-open={searchOpen} className="store-header sticky top-0 z-50 border-b border-[#b99c73]/30 bg-[#fbf8f3]/95 backdrop-blur-md"><div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between gap-3 px-4 md:h-[80px] md:px-8">
    <button onClick={() => { setMobileOpen(false); navigate("home"); }} className="store-wordmark shrink-0 whitespace-nowrap font-['Cormorant_Garamond',serif] text-[17px] font-semibold tracking-wide text-[#3b2b20] md:text-[21px]">DECANTS BY JOSHUA</button>
    <nav aria-label="Main navigation" className="hidden items-center gap-5 lg:flex">{links.map(link => <button key={link.page} onClick={() => navigate(link.page)} aria-current={page === link.page ? "page" : undefined} className={"whitespace-nowrap border-b pb-1 font-['Cormorant_Garamond',serif] text-[17px] text-[#513b29] transition-opacity hover:opacity-60 " + (page === link.page ? "border-[#a78351]" : "border-transparent")}>{link.label}</button>)}</nav>
    <div className="flex shrink-0 items-center gap-2 md:gap-4"><HeaderSearch open={searchOpen} onOpenChange={setSearchOpen} products={ALL_PRODUCTS} onProduct={product => navigate("product", product)} onSearch={query => navigate("search", query)} /><button onClick={onAccount} aria-label="Open account" className="hidden md:flex"><User size={19} strokeWidth={1.3} /></button><button onClick={() => navigate("wishlist")} aria-label={`Open wishlist (${wishlist.count} saved items)`} className="relative"><Heart size={19} strokeWidth={1.3} fill={page === "wishlist" ? "currentColor" : "none"} />{wishlist.count > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-[#765132] px-1 text-[9px] text-white">{wishlist.count}</span>}</button><button onClick={() => navigate("cart")} aria-label={`Open bag (${cartCount} items)`} className="relative"><ShoppingCart size={19} strokeWidth={1.3} />{cartCount > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-[#765132] px-1 text-[9px] text-white">{cartCount}</span>}</button><button onClick={() => setMobileOpen(value => !value)} aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen} aria-controls="mobile-store-menu" className="lg:hidden">{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button></div>
  </div>{mobileOpen && <nav id="mobile-store-menu" aria-label="Mobile navigation" className="grid gap-1 border-t border-[#b99c73]/20 bg-[#fbf8f3] px-5 py-4 lg:hidden">{links.map(link => <button className="py-2 text-left font-['Cormorant_Garamond',serif] text-xl text-[#513b29]" key={link.page} onClick={() => { setMobileOpen(false); navigate(link.page); }}>{link.label}</button>)}<button className="py-2 text-left font-['Cormorant_Garamond',serif] text-xl" onClick={() => { setMobileOpen(false); onAccount(); }}>Your account</button></nav>}</header>;
}


// â”€â”€â”€ FOOTER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Footer({ navigate }: { navigate: (p: Page, d?: unknown) => void }) {
  return (
<footer className="bg-[#171513] text-[#f5f1ea] px-8 md:px-16 pt-14 pb-8">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
        <div>
          <p className="font-['Cormorant_Garamond',serif] font-semibold text-[22px] tracking-wide mb-1">DECANTS BY JOSHUA</p>
          <p className="font-['Cormorant_Garamond',serif] italic text-[#b6ada0] text-[15px]">Every fragrance tells a story.</p>
        </div>
        <div>
          <p className="font-['IBM_Plex_Sans',sans-serif] font-semibold text-[14px] tracking-[0.14em] mb-4">SHOP</p>
          {([["Collections", "collections"], ["Discovery Sets", "discovery"], ["Best Sellers", "bestsellers"]] as [string, Page][]).map(([l, p]) => (
            <button key={l} onClick={() => navigate(p)}
              className="block font-['IBM_Plex_Sans',sans-serif] font-light text-[#b6ada0] text-[14px] mb-2 hover:text-white transition-colors text-left">{l}</button>
          ))}
        </div>
        <div>
          <p className="font-['IBM_Plex_Sans',sans-serif] font-semibold text-[14px] tracking-[0.14em] mb-4">SOCIAL</p>
          {["Tiktok", "Facebook", "Instagram"].map((l) => (
            <p key={l} className="font-['IBM_Plex_Sans',sans-serif] font-light text-[#b6ada0] text-[14px] mb-2">{l}</p>
          ))}
        </div>
        <div>
          <p className="font-['IBM_Plex_Sans',sans-serif] font-semibold text-[14px] tracking-[0.14em] mb-4">SUPPORT</p>
          {([["Contact", "home"], ["FAQ", "faq"], ["Decant Guide", "decantguide"]] as [string, Page][]).map(([l, p]) => (
            <button key={l} onClick={() => navigate(p)}
              className="block font-['IBM_Plex_Sans',sans-serif] font-light text-[#b6ada0] text-[14px] mb-2 hover:text-white transition-colors text-left">{l}</button>
          ))}
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto border-t border-[#2e2b27] pt-5">
        <p className="font-['Cormorant_Garamond',serif] italic text-[#b6ada0] text-[14px]">© 2026 Decants by Joshua</p>
      </div>
    </footer>
  );
}

// â”€â”€â”€ PRODUCT CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ProductCard({ product, navigate, rank }: { product: Product; navigate: (p: Page, d?: unknown) => void; rank?: number }) {
  return <ShopProductCard product={product} rank={rank} horizontal onOpen={() => navigate("product", product)} />;
}
function CompactProductCard({ product, navigate, rank }: { product: Product; navigate: (p: Page, d?: unknown) => void; rank?: number }) {
  return <ShopProductCard product={product} rank={rank} onOpen={() => navigate("product", product)} />;
}
function RelatedProductCard({ product, navigate }: { product: Product; navigate: (p: Page, d?: unknown) => void }) {
  return <ShopProductCard product={product} onOpen={() => navigate("product", product)} />;
}

function RevealSection({
  children,
  className,
  id,
  color,
  backdropColor,
  backdropImage,
  backgroundImage,
  backgroundOverlayClassName,
  overlap = true,
  overlapAmount = 112,
  revealOffset = 56,
  fadeContent = true,
  hideUntilReveal = false,
  triggerRootMargin = "0px 0px -12% 0px",
}: {
  children: React.ReactNode;
  className: string;
  id?: string;
  color: string;
  backdropColor?: string;
  backdropImage?: boolean;
  backgroundImage?: string;
  backgroundOverlayClassName?: string;
  overlap?: boolean;
  overlapAmount?: number;
  revealOffset?: number;
  fadeContent?: boolean;
  hideUntilReveal?: boolean;
  triggerRootMargin?: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardControls = useAnimationControls();
  const contentControls = useAnimationControls();
  const lastScrollY = useRef(0);
  const isScrollingDown = useRef(true);
  const hasRevealed = useRef(false);
  const isAnimating = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    const onScroll = () => {
      const nextY = window.scrollY;
      isScrollingDown.current = nextY >= lastScrollY.current;
      lastScrollY.current = nextY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          return;
        }

        if (!isScrollingDown.current) {
          hasRevealed.current = false;
          isAnimating.current = false;
          cardControls.set({ y: revealOffset, opacity: hideUntilReveal ? 0 : 1 });
          contentControls.set(fadeContent ? { y: 36, opacity: 0 } : { y: 0, opacity: 1 });
        }
      },
      { threshold: 0.06, rootMargin: triggerRootMargin }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [cardControls, contentControls, hideUntilReveal, triggerRootMargin]);

  const reveal = () => {
    if (hasRevealed.current || isAnimating.current) return;

    if (!isScrollingDown.current) {
      hasRevealed.current = true;
      cardControls.set({ y: 0 });
      contentControls.set({ y: 0, opacity: 1 });
      return;
    }

    hasRevealed.current = true;
    isAnimating.current = true;
    cardControls.set({ y: revealOffset, opacity: hideUntilReveal ? 0 : 1 });
    contentControls.set(fadeContent ? { y: 36, opacity: 0 } : { y: 0, opacity: 1 });
    void cardControls.start({
      y: 0,
      opacity: 1,
      transition: { duration: 0.82, ease: [0.19, 1, 0.22, 1] },
    }).then(() => {
      isAnimating.current = false;
    });
    if (fadeContent) {
      void contentControls.start({
        y: 0,
        opacity: 1,
        transition: { duration: 0.58, delay: 0.08, ease: [0.19, 1, 0.22, 1] },
      });
    }
  };

  return (
    <section
      ref={sectionRef}
      id={id}
      data-card-color={color}
      className="relative min-h-[100svh] overflow-visible bg-transparent md:min-h-[106svh]"
      style={{ backgroundColor: backdropColor ?? color, marginTop: overlap ? `clamp(-${overlapAmount}px, -7vw, -48px)` : 0 }}
    >
      <motion.div
        initial={{ y: revealOffset, opacity: hideUntilReveal ? 0 : 1 }}
        animate={cardControls}
        className={`relative z-10 w-full ${className}`}
      >
        {backgroundImage ? (
          <div className="absolute inset-0">
            <img src={backgroundImage} alt="" className="h-full w-full object-cover" />
            <div className={`absolute inset-0 ${backgroundOverlayClassName ?? ""}`} />
          </div>
        ) : null}
        <motion.div initial={fadeContent ? { y: 36, opacity: 0 } : { y: 0, opacity: 1 }} animate={contentControls} className="relative h-full min-h-[inherit] w-full">
          {children}
        </motion.div>
      </motion.div>
    </section>
  );
}

function CustomCursor({ disabled = false }: { disabled?: boolean }) {
  const [enabled, setEnabled] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    if (disabled || !finePointer.matches) { setEnabled(false); return; }

    setEnabled(true);

    let showing = false;
    const hide = () => {
      cursorRef.current?.classList.add("opacity-0");
      document.body.classList.remove("joshua-custom-cursor");
      showing = false;
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !finePointer.matches) { hide(); return; }
      const cursorElement = cursorRef.current;
      if (!cursorElement) return;
      // Position directly: no animation-frame backlog or React render per movement.
      cursorElement.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
      if (!showing) {
        cursorElement.classList.remove("opacity-0");
        document.body.classList.add("joshua-custom-cursor");
        showing = true;
      }
    };
    const leave = (event: PointerEvent) => { if (!event.relatedTarget) hide(); };
    const visibility = () => { if (document.hidden) hide(); };
    window.addEventListener("pointermove", move, { passive: true, capture: true });
    window.addEventListener("pointerdown", move, { passive: true, capture: true });
    window.addEventListener("pointerout", leave);
    window.addEventListener("blur", hide);
    document.documentElement.addEventListener("pointerleave", hide);
    document.addEventListener("visibilitychange", visibility);

    return () => {
      hide();
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerdown", move, true);
      window.removeEventListener("pointerout", leave);
      window.removeEventListener("blur", hide);
      document.documentElement.removeEventListener("pointerleave", hide);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [disabled]);

  if (!enabled || disabled) return null;

  return (
    <>
      <style>{`
        @media (pointer: fine) {
          body.joshua-custom-cursor:not(:has(dialog[open])),
          body.joshua-custom-cursor:not(:has(dialog[open])) * {
            cursor: none !important;
          }
          body:has(dialog[open]) .joshua-cursor { display: none; }
          .joshua-cursor {
            border-color: rgba(111, 88, 49, 0.78);
            background: rgba(243, 234, 217, 0.12);
            box-shadow: 0 0 0 1px rgba(243, 234, 217, 0.42), 0 0 18px rgba(111, 88, 49, 0.18);
            will-change: transform;
          }
          .joshua-cursor::after {
            content: "";
            position: absolute;
            left: 50%;
            top: 50%;
            height: 10px;
            width: 10px;
            border-radius: 999px;
            transform: translate(-50%, -50%);
            transition: background-color 150ms ease, box-shadow 150ms ease;
            background: #6f5831;
            box-shadow: 0 0 0 2px rgba(243, 234, 217, 0.76), 0 0 10px rgba(111, 88, 49, 0.35);
          }
        }
      `}</style>
      <div
        ref={cursorRef}
        aria-hidden
        className="joshua-cursor pointer-events-none fixed left-0 top-0 z-[9999] h-11 w-11 rounded-full border opacity-0 transition-[border-color,box-shadow,opacity] duration-150"
      />
    </>
  );
}

// â”€â”€â”€ HOME PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CinematicHomePage({ navigate }: { navigate: (p: Page, d?: unknown) => void }) {
  const collections = [
    { label: "ICONIC CLASSICS", text: "Timeless fragrances, new perspectives.", image: imgFresh, category: "FRESH" },
    { label: "NICHE DISCOVERIES", text: "Extraordinary scents for curious noses.", image: imgTimber, category: "TIMBER & SMOKE" },
    { label: "SEASONAL EDIT", text: "Curated scents for every season.", image: imgVanilla, category: "GOLDEN VANILLA" },
    { label: "TRAVEL ESSENTIALS", text: "Take your favourites anywhere.", image: imgAfterHours, category: "AFTER HOURS" },
  ];
  const bestSellerArt = [imgProd1, imgProd2, imgBottle, imgProd1, imgProd2];
  const bestSellers = ALL_PRODUCTS.filter((product) => product.bestSeller).slice(0, 5).map((product, index) => ({
    ...product,
    img: bestSellerArt[index],
  }));
  return (
    <div className="cinematic-home bg-[#f8f2e8] text-[#2b211b]">
      <section className="cinematic-hero relative min-h-[calc(100svh-80px)] overflow-hidden">
        <img src={imgWhyLuxuryBg} alt="Decant bottles resting on silk" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f8f2e8]/95 via-[#f8f2e8]/60 to-[#f8f2e8]/10" />
        <div className="relative mx-auto flex min-h-[calc(100svh-80px)] max-w-[1440px] items-end px-8 pb-12 md:px-16 md:pb-16 lg:px-24">
          <div className="max-w-[550px] cinematic-hero-copy">
            <p className="mb-5 font-['IBM_Plex_Sans',sans-serif] text-[11px] font-semibold tracking-[0.35em] text-[#9a7d45]">FRAGRANCE, MORE FREELY</p>
            <h1 className="font-['Cormorant_Garamond',serif] text-[62px] font-medium leading-[0.86] tracking-[-0.02em] md:text-[92px]">Your signature<br />scent, decanted.</h1>
            <p className="mt-6 max-w-[430px] font-['IBM_Plex_Sans',sans-serif] text-[15px] leading-relaxed text-[#2b211b]/70">Discover iconic and niche fragrances in perfectly portioned decants. Luxury scents, without the commitment.</p>
            <DarkBtn onClick={() => navigate("collections")} className="mt-7 bg-[#3a2418] px-7 text-[#f8f2e8] hover:bg-[#5a3927]">SHOP DECANTS <span className="ml-3">→</span></DarkBtn>
          </div>
        </div>
        <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 gap-4 border-t border-[#3a2418]/20 px-8 py-5 font-['IBM_Plex_Sans',sans-serif] text-[11px] text-[#2b211b]/75 sm:grid-cols-3 md:px-24">
          <span>✦ AUTHENTIC FRAGRANCES<br /><em className="pl-4">from trusted sources</em></span>
          <span>✦ PREMIUM DECANTS<br /><em className="pl-4">&amp; packaging</em></span>
          <span>✦ SHIPPING WITH CARE<br /><em className="pl-4">across the Philippines</em></span>
        </div>
      </section>
      <section className="mx-auto max-w-[1440px] px-8 py-14 md:px-16 md:py-20 lg:px-24">
        <div className="mb-7 flex items-end justify-between"><h2 className="font-['Cormorant_Garamond',serif] text-[38px] leading-none md:text-[48px]">Explore collections</h2><span className="hidden font-['IBM_Plex_Sans',sans-serif] text-[11px] tracking-[0.18em] text-[#9a7d45] md:block">FIND YOUR MOOD →</span></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{collections.map((item) => <button key={item.label} onClick={() => navigate("collections", { category: item.category })} className="cinematic-collection group relative h-[220px] overflow-hidden rounded-[5px] text-left"><img src={item.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-[#2b211b]/80 via-[#2b211b]/15 to-transparent" /><div className="absolute bottom-5 left-5 text-[#f8f2e8]"><p className="font-['Cormorant_Garamond',serif] text-[25px] leading-none">{item.label}</p><p className="mt-2 text-[12px] text-[#f8f2e8]/75">{item.text}</p><span className="mt-4 inline-block text-[10px] tracking-[0.18em]">EXPLORE →</span></div></button>)}</div>
      </section>
      <section className="border-y border-[#3a2418]/15 bg-[#eee2d2] px-8 py-14 md:px-16 lg:px-24"><div className="mx-auto max-w-[1440px]"><div className="mb-8 flex items-end justify-between"><div><p className="mb-2 text-[11px] font-semibold tracking-[0.25em] text-[#9a7d45]">THE EDIT</p><h2 className="font-['Cormorant_Garamond',serif] text-[42px] leading-none md:text-[54px]">Bestsellers</h2></div><button onClick={() => navigate("bestsellers")} className="text-[11px] tracking-[0.16em]">VIEW ALL →</button></div><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">{bestSellers.map((product) => <button key={product.id} onClick={() => navigate("product", product)} className="group bg-[#f8f2e8] p-3 text-left transition duration-500 hover:-translate-y-2 hover:shadow-[0_20px_45px_rgba(42,34,25,0.13)]"><div className="flex h-[190px] items-center justify-center bg-[#eadcc8]"><img src={product.img} alt={product.name} className="h-[165px] object-contain transition duration-700" /></div><p className="mt-4 text-[10px] tracking-[0.16em] text-[#9a7d45]">{product.family.toUpperCase()}</p><h3 className="mt-1 font-['Cormorant_Garamond',serif] text-[23px] leading-none">{product.name}</h3><p className="mt-3 text-[12px] text-[#2b211b]/55">From PHP {product.price}</p></button>)}</div></div></section>
      <section className="cinematic-about mx-auto grid max-w-[1440px] gap-10 border-y border-[#3a2418]/20 px-8 py-16 md:grid-cols-[0.75fr_1.25fr] md:items-center md:px-16 md:py-24 lg:px-24"><div><p className="text-[11px] font-semibold tracking-[0.3em] text-[#9a7d45]">ABOUT JOSHUA</p><p className="mt-5 font-['Cormorant_Garamond',serif] text-[74px] leading-none text-[#3a2418]/12">01</p></div><div className="max-w-[720px]"><h2 className="font-['Cormorant_Garamond',serif] text-[44px] leading-[0.95] md:text-[64px]">A fragrance can be personal before it becomes permanent.</h2><p className="mt-6 max-w-[590px] font-['IBM_Plex_Sans',sans-serif] text-[15px] leading-relaxed text-[#2b211b]/68">I created Decants by Joshua for the part of fragrance discovery that happens between curiosity and commitment. Small portions, authentic scents, and enough time on skin to find what feels like you.</p><button onClick={() => navigate("decantguide")} className="mt-7 border-b border-[#3a2418] pb-2 text-[11px] tracking-[0.18em]">THE JOSHUA SCENT METHOD →</button></div></section>
      <section className="mx-2 my-10 flex min-h-[250px] items-center justify-between overflow-hidden rounded-[5px] bg-[#e5d3bb] px-8 md:px-20"><div><p className="text-[11px] font-semibold tracking-[0.3em] text-[#9a7d45]">THE JOURNAL</p><h2 className="mt-4 max-w-[560px] font-['Cormorant_Garamond',serif] text-[42px] leading-[0.9] md:text-[58px]">A more personal<br />way to experience fragrance</h2><button onClick={() => navigate("decantguide")} className="mt-5 text-[11px] tracking-[0.18em]">READ THE GUIDE →</button></div><img src={imgProd1} alt="A Joshua decant" className="hidden h-[250px] w-[38%] object-contain md:block" /></section>
    </div>
  );
}

function CinematicHeroOnly({ navigate }: { navigate: (p: Page, d?: unknown) => void }) {
  return (
    <section className="cinematic-hero relative min-h-[calc(100svh-80px)] overflow-hidden">
      <img src={imgWhyLuxuryBg} alt="Decant bottles resting on silk" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#f8f2e8]/95 via-[#f8f2e8]/60 to-[#f8f2e8]/10" />
      <div className="relative mx-auto flex min-h-[calc(100svh-80px)] max-w-[1440px] items-end px-8 pb-12 md:px-16 md:pb-16 lg:px-24">
        <div className="max-w-[550px] cinematic-hero-copy">
          <p className="mb-5 font-['IBM_Plex_Sans',sans-serif] text-[11px] font-semibold tracking-[0.35em] text-[#9a7d45]">FRAGRANCE, MORE FREELY</p>
          <h1 className="font-['Cormorant_Garamond',serif] text-[62px] font-medium leading-[0.86] tracking-[-0.02em] md:text-[92px]">Your signature<br />scent, decanted.</h1>
          <p className="mt-6 max-w-[430px] font-['IBM_Plex_Sans',sans-serif] text-[15px] leading-relaxed text-[#2b211b]/70">Discover iconic and niche fragrances in perfectly portioned decants. Luxury scents, without the commitment.</p>
          <DarkBtn onClick={() => navigate("collections")} className="mt-7 bg-[#3a2418] px-7 text-[#f8f2e8] hover:bg-[#5a3927]">SHOP DECANTS <span className="ml-3">→</span></DarkBtn>
        </div>
      </div>
    </section>
  );
}

function HomePage({ navigate }: { navigate: (p: Page, d?: unknown) => void }) {
  return <EditorialHome
    products={ALL_PRODUCTS}
    sets={DISCOVERY_SETS}
    images={{ hero: imgWhyLuxuryBg, fresh: imgFresh, timber: imgTimber, vanilla: imgVanilla, night: imgAfterHours, discovery: imgDiscoveryBg, bottle: imgCollProduct }}
    onCollections={category => navigate("collections", category ? { categories: [category] } : undefined)}
    onProduct={product => navigate("product", product)}
    onSet={id => navigate("discoverySet", id)}
    onPage={page => navigate(page)}
  />;
}
function SearchResultsPage({ query, navigate }: { query: string; navigate: (page: Page, data?: unknown) => void }) {
  return <SearchExperience products={ALL_PRODUCTS} query={query} onSearch={value => navigate("search", value)} onProduct={product => navigate("product", product)} onCollections={() => navigate("collections")} />;
}

function CollectionsPage({ navigate, initialFilters, onChange }: {
  navigate: (p: Page, d?: unknown) => void;
  initialFilters?: Partial<Filters>;
  onChange: (state: CatalogState) => void;
}) {
  return <CollectionExperience products={ALL_PRODUCTS} state={{ ...EMPTY_CATALOG, ...initialFilters }} onChange={onChange}
    images={{ hero: imgWhyLuxuryBg, FRESH: imgFresh, "TIMBER & SMOKE": imgTimber, "GOLDEN VANILLA": imgVanilla, "AFTER HOURS": imgAfterHours, EVERYDAY: imgWhyLuxuryBg }}
    onProduct={product => navigate("product", product)} onHome={() => navigate("home")} onFinder={() => navigate("scentfinder")} />;
}
function BestSellersPage({ navigate }: { navigate: (page: Page, data?: unknown) => void }) {
  return <BestSellersExperience products={ALL_PRODUCTS} image={imgWhyLuxuryBg} onProduct={product => navigate("product", product)} onCollections={() => navigate("collections")} onFinder={() => navigate("scentfinder")} />;
}

function DiscoveryPage({ navigate, selectedSetId }: { navigate: (p: Page, d?: unknown) => void; selectedSetId?: number | null }) {
  return <DiscoveryCollection sets={DISCOVERY_SETS} products={ALL_PRODUCTS} images={{ silk: imgWhyLuxuryBg, texture: imgDiscoveryBg }} selectedSetId={selectedSetId} onSet={id => navigate("discoverySet", id)} onProduct={product => navigate("product", product)} onFinder={() => navigate("scentfinder")} />;
}

function DiscoverySetPage({ setId, navigate }: { setId: number | null; navigate: (p: Page, d?: unknown) => void }) {
  return <DiscoveryDetail key={setId} sets={DISCOVERY_SETS} products={ALL_PRODUCTS} images={{ silk: imgWhyLuxuryBg, texture: imgDiscoveryBg }} setId={setId} onSet={id => navigate("discoverySet", id)} onProduct={product => navigate("product", product)} onFinder={() => navigate("scentfinder")} onBack={() => navigate("discovery", setId)} />;
}

function ProductPage({ product, navigate, addToCart, collectionFilters }: { product: Product; navigate: (p: Page, d?: unknown) => void; addToCart: (p: Product, size: string, price: number, quantity?: number) => void; collectionFilters: Partial<Filters> }) {
  const related = [...ALL_PRODUCTS.filter(p => p.id !== product.id && p.family === product.family), ...ALL_PRODUCTS.filter(p => p.id !== product.id && p.family !== product.family)].slice(0, 4);
  return <ProductDetail key={product.id} product={product} related={related} onOpen={p => navigate("product", p)} onBack={() => navigate("collections", collectionFilters)} addToBag={addToCart} openBag={() => navigate("cart")} />;
}

function CartPage({ items, navigate, updateQty, removeItem }: { items: CartItem[]; navigate: (p: Page) => void; updateQty: (id: number, size: string, qty: number) => void; removeItem: (id: number, size: string) => void }) {
  return <BagPage items={items} updateQty={updateQty} removeItem={removeItem} onShop={() => navigate("collections")} onCheckout={() => navigate("checkout")} />;
}

function CheckoutPage({ items, navigate, onOrderPlaced }: { items: CartItem[]; navigate: (p: Page) => void; onOrderPlaced: () => void }) {
  const prototype = import.meta.env.VITE_ENABLE_CHECKOUT !== "true";
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({ name: "", email: localStorage.getItem("joshua-scents-guest-email") || "", phone: "", address: "", city: "", zip: "", payment: "paymongo" });
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [delivery, setDelivery] = useState<{ quotationId?: string; amountCentavos: number }>({ amountCentavos: 0 });
  const [checkoutError, setCheckoutError] = useState("");
  const [placing, setPlacing] = useState(false);
  const subtotal = items.reduce((acc, i) => acc + i.price * i.qty, 0);
  const shipping = delivery.amountCentavos / 100;
  const total = subtotal + shipping;

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    let active = true;

    const prefillAccountDetails = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user || !active) return;
      const [{ data: profile }, { data: address }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
        supabase.from("addresses").select("recipient_name, phone, address_line, city, postal_code").eq("user_id", user.id).eq("is_default", true).maybeSingle(),
      ]);
      if (!active) return;
      setForm((current) => ({
        ...current,
        name: address?.recipient_name || profile?.full_name || current.name,
        email: user.email || current.email,
        phone: address?.phone || profile?.phone || current.phone,
        address: address?.address_line || current.address,
        city: address?.city || current.city,
        zip: address?.postal_code || current.zip,
      }));
    };

    void prefillAccountDetails();
    return () => { active = false; };
  }, []);

  const validateShipping = () => {
    if (!form.name.trim() || !form.email.includes("@") || !form.phone.trim() || !form.address.trim() || !form.city.trim() || !form.zip.trim()) {
      setCheckoutError("Complete every shipping field before continuing.");
      return false;
    }
    setCheckoutError("");
    return true;
  };

  const continueToPayment = async () => {
    if (!validateShipping()) return;
    if (!prototype && import.meta.env.VITE_ENABLE_LALAMOVE === "true") {
      if (!coordinates) { setCheckoutError("Select an address suggestion so delivery can be quoted accurately."); return; }
      try {
        setPlacing(true);
        const quote = await getDeliveryQuote({ address: form.address, ...coordinates });
        setDelivery({ quotationId: quote.quotationId, amountCentavos: quote.amountCentavos });
      } catch (error) {
        setCheckoutError(error instanceof Error ? error.message : "Delivery could not be quoted.");
        return;
      } finally { setPlacing(false); }
    }
    setStep(2);
  };

  const placeOrder = async () => {
    if (prototype) { setCheckoutError("Checkout is preview-only. No order or payment has been created."); return; }
    setCheckoutError("");
    setPlacing(true);
    try {
      const result = await createCheckout({
        customer: { name: form.name, email: form.email, phone: form.phone, address: form.address, city: form.city, zip: form.zip, ...(coordinates ?? {}) },
        paymentMethod: form.payment as "paymongo" | "cod",
        deliveryQuoteId: delivery.quotationId,
        shippingCentavos: delivery.amountCentavos,
        items: items.map((item) => ({ productId: item.product.id, size: item.size, quantity: item.qty })),
      });
      sessionStorage.setItem("last-order-reference", result.reference);
      trackStoreEvent(form.payment === "cod" ? "purchase" : "begin_checkout", total, form.email);
      if (result.checkoutUrl) { window.location.assign(result.checkoutUrl); return; }
      onOrderPlaced();
      navigate("confirmation");
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "We could not place your order. Please try again.");
    } finally { setPlacing(false); }
  };

  const changeField = (name: keyof typeof form, value: string) => {
    if (name === "address") setCoordinates(null);
    setForm(current => ({ ...current, [name]: value }));
    setStep(1);
  };
  return <CheckoutInterface prototype={prototype} items={items} form={form} onField={(name, value) => {
    if (name === "payment") { setForm(current => ({ ...current, payment: value })); setStep(2); }
    else changeField(name, value);
  }} onAddress={address => {
    setCoordinates({ latitude: address.latitude, longitude: address.longitude });
    setForm(current => ({ ...current, address: address.address, city: address.city || current.city, zip: address.zip || current.zip }));
    setStep(1);
  }} step={step} onStep={setStep} onContinue={() => void continueToPayment()} onPlace={() => void placeOrder()} onBack={() => navigate("cart")} onShop={() => navigate("collections")} placing={placing} error={checkoutError} shipping={shipping} quoteRequired={import.meta.env.VITE_ENABLE_LALAMOVE === "true"} />;
}

function ConfirmationPage({ navigate }: { navigate: (p: Page) => void }) {
  const reference = sessionStorage.getItem("last-order-reference") || new URLSearchParams(window.location.search).get("order");
  return (
    <div className="bg-[#f7f5f1] min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-[500px] flex flex-col items-center py-20">
        <div className="w-20 h-20 bg-[#AE9766]/15 rounded-full flex items-center justify-center mb-8">
          <Check size={32} strokeWidth={1.5} className="text-[#AE9766]" />
        </div>
        <GoldBar />
        <h1 className="font-['Cormorant_Garamond',serif] font-bold text-[52px] text-[#171717] tracking-[0.04em] mt-6 mb-3">ORDER PLACED!</h1>
        <p className="font-['Cormorant_Garamond',serif] italic text-[20px] text-[rgba(23,23,23,0.6)] mb-4">
          Thank you. Your fragrance journey begins now.
        </p>
        {reference && <p className="mb-4 font-['IBM_Plex_Sans',sans-serif] text-[12px] tracking-[0.14em] text-[#8f7444]">REFERENCE {reference}</p>}
        <p className="font-['IBM_Plex_Sans',sans-serif] font-light text-[14px] text-[rgba(23,23,23,0.55)] leading-relaxed mb-10">
          {"We'll send you a confirmation email with tracking details once your decants are carefully packed and dispatched."}
        </p>
        <div className="grid grid-cols-3 gap-4 mb-10 w-full">
          {[{ Icon: Package, label: "Being Packed", desc: "1-2 days" }, { Icon: Truck, label: "Shipped", desc: "3-5 days" }, { Icon: Check, label: "Delivered", desc: "Nationwide" }].map(({ Icon, label, desc }, i) => (
            <div key={i} className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="flex justify-center mb-2 text-[#AE9766]"><Icon size={20} strokeWidth={1.5} /></div>
              <p className="font-['IBM_Plex_Sans',sans-serif] text-[12px] font-medium text-[#171717]">{label}</p>
              <p className="font-['IBM_Plex_Sans',sans-serif] text-[11px] text-[rgba(23,23,23,0.45)]">{desc}</p>
            </div>
          ))}
        </div>
        <DarkBtn onClick={() => navigate("home")}>BACK TO HOME</DarkBtn>
      </div>
    </div>
  );
}

// â”€â”€â”€ DECANT GUIDE PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ScentFinderPage({ navigate }: { navigate: (page: Page, data?: unknown) => void }) {
  return <ScentExperience products={ALL_PRODUCTS} onProduct={product => navigate("product", product)} onCollections={() => navigate("collections")} />;
}

function DecantGuidePage({ navigate }: { navigate: (page: Page, data?: unknown) => void }) {
  return <DecantGuideExperience onCollections={size => navigate("collections", size ? { size } : {})} onFinder={() => navigate("scentfinder")} />;
}
function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "Are your decants authentic?", a: "Absolutely. We source all fragrances from authorized distributors and trusted collectors only. Every bottle is verified before decanting. We never purchase from unverified resellers." },
    { q: "How long does shipping take?", a: "We ship within 2-3 business days of order confirmation. Delivery typically takes 3-5 business days nationwide. You will receive a tracking number via email once your order is dispatched." },
    { q: "What payment methods do you accept?", a: "We accept GCash, Cash on Delivery (COD), and bank transfers via BDO, BPI, and UnionBank. All transactions are handled securely." },
    { q: "Can I request a specific fragrance not listed?", a: "Yes! Message us on our social media or through the contact form with the fragrance you are looking for. We will do our best to source it for you." },
    { q: "What if my order arrives damaged?", a: "Please send us a photo within 24 hours of receiving your order and we will arrange a replacement or full refund - no questions asked." },
    { q: "Do you offer discounts for bulk orders?", a: "Yes, we offer special pricing for orders of 5 or more decants. Reach out to us directly for bulk order inquiries." },
    { q: "How should I store my decants?", a: "Store in a cool, dark place away from direct sunlight and heat. Keep caps on tightly. Properly stored decants can last 2-3 years or more." },
    { q: "Do you ship internationally?", a: "Currently we ship within the Philippines only. We are actively working on international shipping - follow us on social media for updates." },
  ];

  return (
    <div className="bg-[#f7f5f1] min-h-screen">
      <section className="flex flex-col items-center text-center py-14 px-6">
        <GoldBar />
        <h1 className="font-['Cormorant_Garamond',serif] font-bold text-[54px] md:text-[72px] text-[#171717] tracking-[0.04em] mt-6 mb-4">FAQ</h1>
        <p className="font-['IBM_Plex_Sans',sans-serif] font-light text-[17px] text-[rgba(23,23,23,0.65)] max-w-md">
          {"Can't find an answer? Reach out to us on social media."}
        </p>
      </section>
      <section className="px-6 pb-20">
        <div className="max-w-[740px] mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-[0px_2px_12px_rgba(0,0,0,0.05)] overflow-hidden">
              <button className="w-full flex items-center justify-between px-7 py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}>
                <p className="font-['Cormorant_Garamond',serif] font-semibold text-[19px] text-[#171717] pr-5 leading-tight">{faq.q}</p>
                {open === i
                  ? <ChevronUp size={16} className="flex-shrink-0 text-[rgba(23,23,23,0.35)]" />
                  : <ChevronDown size={16} className="flex-shrink-0 text-[rgba(23,23,23,0.35)]" />}
              </button>
              {open === i && (
                <div className="px-7 pb-6 border-t border-[rgba(0,0,0,0.06)]">
                  <p className="font-['IBM_Plex_Sans',sans-serif] font-light text-[14px] text-[rgba(23,23,23,0.68)] leading-[1.8] pt-4">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// â”€â”€â”€ ROOT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function App() {
  return /^\/admin\/?$/.test(window.location.pathname) ? <AdminPortal /> : <StorefrontApp />;
}

function StorefrontApp() {
  const wishlist = useWishlist();
  const initialParams = new URLSearchParams(window.location.search);
  const views: Page[] = ["home", "collections", "wishlist", "search", "bestsellers", "discovery", "discoverySet", "scentfinder", "decantguide", "faq", "product"];
  const requestedView = initialParams.get("view") as Page;
  const initialPage: Page = initialParams.get("payment") === "success" && import.meta.env.VITE_ENABLE_CHECKOUT === "true" ? "confirmation" : views.includes(requestedView) ? requestedView : "home";
  const initialProduct = ALL_PRODUCTS.find(product => product.id === Number(initialParams.get("id"))) ?? ALL_PRODUCTS[0];
  const initialSet = DISCOVERY_SETS.find(set => set.id === Number(initialParams.get("set")))?.id ?? null;
  const initialQuery = initialParams.get("q")?.slice(0, 200) ?? "";
  const initialCollection = catalogFromSearch(window.location.search);
  const [page, setPage] = useState<Page>(initialPage);
  const [selectedProduct, setSelectedProduct] = useState<Product>(initialProduct);
  const [selectedDiscoverySetId, setSelectedDiscoverySetId] = useState<number | null>(initialSet);
  const [collectionFilters, setCollectionFilters] = useState<Partial<Filters>>(initialCollection);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [accountOpen, setAccountOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const pageRef = useRef<Page>(initialPage);
  const selectedProductRef = useRef<Product>(initialProduct);
  const selectedDiscoverySetIdRef = useRef<number | null>(initialSet);
  const collectionFiltersRef = useRef<Partial<Filters>>(initialCollection);
  const searchQueryRef = useRef(initialQuery);

  useEffect(() => {
    const openAccount = () => setAccountOpen(true);
    window.addEventListener("joshua-scents:open-account", openAccount);
    return () => window.removeEventListener("joshua-scents:open-account", openAccount);
  }, []);

  const createHistoryState = (nextPage = pageRef.current): AppHistoryState => ({
    joshuaScents: true,
    page: nextPage,
    productId: selectedProductRef.current.id,
    discoverySetId: selectedDiscoverySetIdRef.current,
    collectionFilters: collectionFiltersRef.current,
    searchQuery: searchQueryRef.current,
  });

  const applyHistoryState = (state: AppHistoryState, scroll = true) => {
    pageRef.current = state.page;
    setPage(state.page);

    const restoredProduct = ALL_PRODUCTS.find((product) => product.id === state.productId);
    if (restoredProduct) {
      selectedProductRef.current = restoredProduct;
      setSelectedProduct(restoredProduct);
    }

    selectedDiscoverySetIdRef.current = state.discoverySetId ?? null;
    setSelectedDiscoverySetId(state.discoverySetId ?? null);

    collectionFiltersRef.current = state.collectionFilters ?? {};
    setCollectionFilters(state.collectionFilters ?? {});

    searchQueryRef.current = state.searchQuery ?? "";
    setSearchQuery(state.searchQuery ?? "");

    if (scroll) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const initialState = createHistoryState(initialPage);
    window.history.replaceState({ ...initialState, guard: true }, "", window.location.href);
    window.history.pushState(initialState, "", window.location.href);

    const onPopState = (event: PopStateEvent) => {
      const state = event.state as AppHistoryState | null;
      if (state?.joshuaScents) {
        applyHistoryState(state);
        if (state.guard) {
          window.history.pushState(createHistoryState(pageRef.current), "", window.location.href);
        }
        return;
      }

      window.history.pushState(createHistoryState(pageRef.current), "", window.location.href);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (p: Page, data?: unknown) => {
    if (p === "product" && data) {
      selectedProductRef.current = data as Product;
      setSelectedProduct(data as Product);
    }
    if (p === "discovery" || p === "discoverySet") {
      selectedDiscoverySetIdRef.current = typeof data === "number" ? data : null;
      setSelectedDiscoverySetId(typeof data === "number" ? data : null);
    }
    if (p === "collections" && data && typeof data === "object") {
      const filters = normalizeCatalog(data as Partial<Filters>);
      collectionFiltersRef.current = filters;
      setCollectionFilters(filters);
    } else if (p === "collections") {
      collectionFiltersRef.current = {};
      setCollectionFilters({});
    }
    if (p === "search" && typeof data === "string") {
      searchQueryRef.current = data.slice(0, 200);
      setSearchQuery(data.slice(0, 200));
    }
    pageRef.current = p;
    setPage(p);
    const nextUrl = new URL(catalogUrl(window.location.href, p === "collections" ? normalizeCatalog(collectionFiltersRef.current) : null), window.location.origin);
    for (const key of ["id", "set", "payment", "order"]) nextUrl.searchParams.delete(key);
    if (p !== "home" && p !== "collections") nextUrl.searchParams.set("view", p);
    if (p === "search" && searchQueryRef.current) nextUrl.searchParams.set("q", searchQueryRef.current);
    if (p === "product") nextUrl.searchParams.set("id", String(selectedProductRef.current.id));
    if ((p === "discovery" || p === "discoverySet") && selectedDiscoverySetIdRef.current) nextUrl.searchParams.set("set", String(selectedDiscoverySetIdRef.current));
    window.history.pushState(createHistoryState(p), "", nextUrl.pathname + nextUrl.search);
    window.scrollTo({ top: 0, behavior: p === "checkout" ? "instant" : "smooth" });
  };

  const updateCollectionState = (state: CatalogState) => {
    collectionFiltersRef.current = state;
    setCollectionFilters(state);
    window.history.replaceState({ ...window.history.state, ...createHistoryState("collections") }, "", catalogUrl(window.location.href, state));
  };

  const addToCart = (product: Product, size: string, price: number, quantity = 1) => {
    trackStoreEvent("add_to_cart", price * quantity);
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && i.size === size);
      if (existing) return prev.map((i) => i.product.id === product.id && i.size === size ? { ...i, qty: i.qty + quantity } : i);
      return [...prev, { product, size, price, qty: quantity }];
    });
  };

  const updateQty = (id: number, size: string, qty: number) => {
    if (qty <= 0) { setCart((prev) => prev.filter((i) => !(i.product.id === id && i.size === size))); return; }
    setCart((prev) => prev.map((i) => i.product.id === id && i.size === size ? { ...i, qty } : i));
  };

  const removeItem = (id: number, size: string) =>
    setCart((prev) => prev.filter((i) => !(i.product.id === id && i.size === size)));

  const cartCount = cart.reduce((a, i) => a + i.qty, 0);

  const renderPage = () => {
    switch (page) {
      case "home":        return <HomePage navigate={navigate} />;
      case "collections": return <CollectionsPage navigate={navigate} initialFilters={collectionFilters} onChange={updateCollectionState} />;
      case "wishlist":    return <WishlistPage products={ALL_PRODUCTS} onProduct={product => navigate("product", product)} onShop={() => navigate("collections")} onOpenAccount={() => setAccountOpen(true)} />;
      case "search":      return <SearchResultsPage query={searchQuery} navigate={navigate} />;
      case "bestsellers": return <BestSellersPage navigate={navigate} />;
      case "discovery":   return <DiscoveryPage navigate={navigate} selectedSetId={selectedDiscoverySetId} />;
      case "discoverySet": return <DiscoverySetPage navigate={navigate} setId={selectedDiscoverySetId} />;
      case "scentfinder": return <ScentFinderPage navigate={navigate} />;
      case "decantguide": return <DecantGuidePage navigate={navigate} />;
      case "faq":         return <FAQPage />;
      case "product":     return <ProductPage product={selectedProduct} navigate={navigate} addToCart={addToCart} collectionFilters={collectionFilters} />;
      case "cart":        return <CartPage items={cart} navigate={navigate} updateQty={updateQty} removeItem={removeItem} />;
      case "checkout":    return <CheckoutPage items={cart} navigate={navigate} onOrderPlaced={() => setCart([])} />;
      case "confirmation":return <ConfirmationPage navigate={navigate} />;
      default:            return <HomePage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f5f1]">
      <CustomCursor disabled={page === "checkout" || bagOpen || accountOpen} />
      <GlobalTexture />
      {page !== "confirmation" && (
        <Header page={page} navigate={(p, data) => p === "cart" ? setBagOpen(true) : navigate(p, data)} cartCount={cartCount} onAccount={() => setAccountOpen(true)} />
      )}
      <AccountCenterDialog open={accountOpen} onClose={() => setAccountOpen(false)} onWishlist={() => { setAccountOpen(false); navigate("wishlist"); }} />
      {wishlist.error && page !== "wishlist" && <div className="wishlist-global-status" role="status"><p>{wishlist.error}</p>{wishlist.userId && <button type="button" disabled={wishlist.busy} onClick={() => void wishlist.retry()}>{wishlist.busy ? "Retrying…" : "Retry sync"}</button>}</div>}
      <StoreActions.Provider value={{ add: addToCart, openBag: () => setBagOpen(true) }}>
        <main className="flex-1">{renderPage()}</main>
      </StoreActions.Provider>
      <BagDrawer open={bagOpen} onClose={() => setBagOpen(false)} items={cart} updateQty={updateQty} removeItem={removeItem} onShop={() => { setBagOpen(false); navigate("collections"); }} onCheckout={() => { setBagOpen(false); navigate("checkout"); }} />
      {page !== "checkout" && page !== "confirmation" && (
        <Footer navigate={navigate} />
      )}
    </div>
  );
}
