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
import { catalogFromSearch, catalogUrl, EMPTY_CATALOG, normalizeCatalog, type CatalogState } from "@/lib/catalog";
import { AddressAutocomplete } from "@/app/components/AddressAutocomplete";
import { BagDrawer, BagPage, CheckoutInterface, ProductDetail, ShopProductCard, StoreActions } from "@/app/components/StorefrontInterfaces";
import { createCheckout, getDeliveryQuote } from "@/lib/api";
import { trackStoreEvent } from "@/lib/analytics";
import { getSupabase } from "@/lib/supabase";
import { searchProducts } from "@/lib/productSearch";

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
const ALL_PRODUCTS: Product[] = [
  { id: 1, name: "Bleu de Chanel", brand: "Creed", family: "Fresh", category: "FRESH", notes: "Fresh â€¢ Woody", price: 250, sizes: [{ label: "2ml", price: 250 }, { label: "5ml", price: 480 }, { label: "10ml", price: 850 }], description: "A woody, aromatic fragrance that defies convention. Opens with grapefruit and lemon, evolves into sandalwood and labdanum for a clean, masculine finish.", img: imgCollProduct, bestSeller: true },
  { id: 2, name: "Sauvage EDP", brand: "Creed", family: "Fresh", category: "FRESH", notes: "Fresh â€¢ Spicy", price: 280, sizes: [{ label: "2ml", price: 280 }, { label: "5ml", price: 530 }, { label: "10ml", price: 920 }], description: "Wild and noble. A powerful gust of freshness rooted in bergamot, ambroxan, and star anise â€” raw, refined, and unmistakable.", img: imgCollProduct, bestSeller: true },
  { id: 3, name: "Aventus", brand: "Creed", family: "Fresh", category: "FRESH", notes: "Fruity â€¢ Chypre â€¢ Smoky", price: 650, sizes: [{ label: "2ml", price: 650 }, { label: "5ml", price: 1200 }, { label: "10ml", price: 2100 }], description: "Inspired by Napoleon Bonaparte. Bergamot, blackcurrant, and birch smoke converge in a legendary, timeless composition.", img: imgCollProduct, bestSeller: true },
  { id: 4, name: "Y EDP", brand: "HSI", family: "Woody", category: "TIMBER & SMOKE", notes: "Fresh â€¢ Fougere", price: 260, sizes: [{ label: "2ml", price: 260 }, { label: "5ml", price: 490 }, { label: "10ml", price: 880 }], description: "Apple, ginger, and ambergris combine in an intensely expressive modern masculine signature.", img: imgCollProduct, bestSeller: false },
  { id: 5, name: "Oud Wood", brand: "HSI", family: "Woody", category: "TIMBER & SMOKE", notes: "Woody â€¢ Oud â€¢ Spicy", price: 580, sizes: [{ label: "2ml", price: 580 }, { label: "5ml", price: 1100 }, { label: "10ml", price: 1900 }], description: "Rare oud from Thailand blended with rosewood, cardamom, sandalwood, and vetiver. Quiet luxury that speaks volumes.", img: imgCollProduct, bestSeller: false },
  { id: 6, name: "La Nuit de L'Homme", brand: "JEM", family: "Woody", category: "TIMBER & SMOKE", notes: "Spicy â€¢ Woody â€¢ Warm", price: 290, sizes: [{ label: "2ml", price: 290 }, { label: "5ml", price: 550 }, { label: "10ml", price: 950 }], description: "Cardamom, cedar, and vetiver intertwine in a sensual woody composition made for the hours after dark.", img: imgCollProduct, bestSeller: false },
  { id: 7, name: "Grand Soir", brand: "JEM", family: "Warm & Spicy", category: "GOLDEN VANILLA", notes: "Amber â€¢ Vanilla â€¢ Warm", price: 420, sizes: [{ label: "2ml", price: 420 }, { label: "5ml", price: 790 }, { label: "10ml", price: 1380 }], description: "An extraordinarily elegant amber fragrance. Vanilla, benzoin, and oakmoss create a rich, enveloping warmth.", img: imgCollProduct, bestSeller: true },
  { id: 8, name: "Black Orchid", brand: "PRMNKY", family: "Warm & Spicy", category: "GOLDEN VANILLA", notes: "Dark â€¢ Floral â€¢ Earthy", price: 370, sizes: [{ label: "2ml", price: 370 }, { label: "5ml", price: 700 }, { label: "10ml", price: 1200 }], description: "A bold, dramatic fragrance combining black truffle, bergamot, ylang ylang, and dark chocolate.", img: imgCollProduct, bestSeller: false },
  { id: 9, name: "Baccarat Rouge 540", brand: "PRMNKY", family: "Floral", category: "GOLDEN VANILLA", notes: "Floral â€¢ Woody â€¢ Musky", price: 850, sizes: [{ label: "2ml", price: 850 }, { label: "5ml", price: 1600 }, { label: "10ml", price: 2800 }], description: "Jasmine, saffron, amberwood, and fir resin fuse in a luminous, unforgettable composition.", img: imgCollProduct, bestSeller: true },
  { id: 10, name: "Dior Homme Intense", brand: "ZENIN", family: "Floral", category: "AFTER HOURS", notes: "Iris â€¢ Lavender â€¢ Leather", price: 320, sizes: [{ label: "2ml", price: 320 }, { label: "5ml", price: 610 }, { label: "10ml", price: 1050 }], description: "A powdery iris heart wrapped in lavender, vetiver, and cedar. Intensely masculine and memorably refined.", img: imgCollProduct, bestSeller: false },
  { id: 11, name: "Tobacco Vanille", brand: "ZENIN", family: "Warm & Spicy", category: "AFTER HOURS", notes: "Tobacco â€¢ Vanilla â€¢ Spice", price: 590, sizes: [{ label: "2ml", price: 590 }, { label: "5ml", price: 1120 }, { label: "10ml", price: 1950 }], description: "Rich tobacco flower blended with vanilla, tonka bean, cacao, and dried fruit â€” a decadent, unforgettable warmth.", img: imgCollProduct, bestSeller: true },
  { id: 12, name: "Terre d'HermÃ¨s", brand: "ZENIN", family: "Woody", category: "EVERYDAY", notes: "Woody â€¢ Earthy â€¢ Citrus", price: 300, sizes: [{ label: "2ml", price: 300 }, { label: "5ml", price: 570 }, { label: "10ml", price: 990 }], description: "Flint, grapefruit, pepper, and vetiver ground a man in the elements. Assertive yet luminous.", img: imgCollProduct, bestSeller: false },
];

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

function matchesProductQuery(product: Product, query: string) {
  const searchable = cleanText([product.name, product.brand].join(" ")).toLowerCase();
  const terms = cleanText(query).toLowerCase().trim().split(/\s+/).filter(Boolean);
  const words = searchable.split(/\s+/);
  return terms.length > 0 && terms.every((term) => words.some((word) => word.startsWith(term)));
}

function useCatalogSearch(query: string, limit: number) {
  const [results, setResults] = useState<Product[]>([]);
  useEffect(() => {
    const normalized = query.trim();
    let cancelled = false;
    if (!normalized) {
      setResults([]);
      return () => { cancelled = true; };
    }
    void searchProducts(normalized)
      .then(({ products }) => {
        if (cancelled) return;
        const ids = new Set(products.map((product) => product.id));
        setResults(ALL_PRODUCTS.filter((product) => ids.has(product.id)).slice(0, limit));
      })
      .catch(() => {
        if (!cancelled) setResults(ALL_PRODUCTS.filter((product) => matchesProductQuery(product, normalized)).slice(0, limit));
      });
    return () => { cancelled = true; };
  }, [query, limit]);
  return results;
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
function Header({ page, navigate, cartCount, onAccount }: {
  page: Page;
  navigate: (p: Page, d?: unknown) => void;
  cartCount: number;
  onAccount: () => void;
}) {
  const wishlist = useWishlist();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const searchResults = useCatalogSearch(searchQuery, 6);

  const toggleSearch = () => {
    if (searchOpen) {
      setSearchQuery("");
      setSearchOpen(false);
      return;
    }
    setSearchOpen(true);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const selectSearchResult = (product: Product) => {
    setSearchOpen(false);
    setSearchQuery("");
    navigate("product", product);
  };

  const navLinks: { label: string; page: Page; action?: () => void }[] = [
    { label: "Home", page: "home" },
    { label: "Collections", page: "collections" },
    { label: "Discovery Sets", page: "discovery" },
    { label: "Find Your Scent", page: "scentfinder" },
    { label: "Best Sellers", page: "bestsellers" },
    { label: "Decant Guide", page: "decantguide" },
  ];

  const isActive = (p: Page, label: string) => {
    return page === p;
  };

  return (
<header className="sticky top-0 z-50 bg-[#FBF8F3] border-b border-black">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 flex items-center justify-between h-[68px] md:h-[80px]">
        {/* Logo */}
        <button onClick={() => navigate("home")}
          className="font-['Cormorant_Garamond',serif] font-semibold text-[18px] md:text-[22px] text-black tracking-wide whitespace-nowrap shrink-0">
          DECANTS BY JOSHUA
        </button>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((item) => (
            <button key={item.label}
              onClick={item.action ?? (() => navigate(item.page))}
              className={`font-['Cormorant_Garamond',serif] text-[18px] text-black transition-opacity hover:opacity-50 ${isActive(item.page, item.label) ? "border-b border-black pb-px" : ""}`}>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Icons */}
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          <div className="relative flex items-center gap-2">
            <div className={`overflow-hidden transition-[width,opacity] duration-300 ${searchOpen ? "w-[150px] opacity-100 md:w-[250px]" : "w-0 opacity-0"}`}>
              <input ref={searchInputRef} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") toggleSearch();
                  if (event.key === "Enter" && searchQuery.trim()) {
                    setSearchOpen(false);
                    navigate("search", searchQuery.trim());
                  }
                }}
                placeholder="Search fragrances..."
                className="h-9 w-full border-b border-black bg-transparent px-1 font-['IBM_Plex_Sans',sans-serif] text-[13px] outline-none placeholder:text-black/35" />
            </div>
            <button onClick={toggleSearch} aria-label={searchOpen ? "Close search" : "Search fragrances"} className="flex hover:opacity-50 transition-opacity">
              {searchOpen ? <X size={20} strokeWidth={1.5} /> : <Search size={20} strokeWidth={1.5} />}
            </button>
        {searchOpen && normalizedSearch && (
              <div className="absolute right-0 top-[44px] z-[70] w-[min(88vw,360px)] overflow-hidden rounded-xl border border-black/10 bg-[#fbf8f1] p-2 shadow-2xl">
                {searchResults.length === 0 ? <p className="px-3 py-6 text-center text-[12px] text-black/45">No matching fragrances.</p> : searchResults.map((product) => (
                  <button key={product.id} onClick={() => selectSearchResult(product)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-[#eee4d4]">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#f0e6d7]"><img src={product.img} alt="" className="h-10 object-contain" /></div>
                    <div className="min-w-0 flex-1"><p className="truncate font-['Cormorant_Garamond',serif] text-[17px] font-semibold">{product.name}</p><p className="truncate text-[10px] text-black/45">{product.family} · {cleanNotes(product.notes)}</p></div>
                    <span className="text-[10px] font-semibold">PHP {product.price}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={onAccount} aria-label="Open account" className="hidden md:flex hover:opacity-50 transition-opacity"><User size={20} strokeWidth={1.5} /></button>
          <button onClick={() => navigate("wishlist")} aria-label={`Open wishlist (${wishlist.count} saved items)`} className="relative flex hover:opacity-50 transition-opacity"><Heart size={20} strokeWidth={1.5} fill={page === "wishlist" ? "currentColor" : "none"} />{wishlist.count > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#765132] px-1 text-[9px] text-white">{wishlist.count}</span>}</button>
          <button aria-label={`Open bag (${cartCount} items)`} onClick={() => navigate("cart")} className="relative hover:opacity-50 transition-opacity">
            <ShoppingCart size={20} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#171717] text-white text-[9px] font-['IBM_Plex_Sans',sans-serif] font-medium rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
          <button className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
<div className="lg:hidden bg-[#FBF8F3] border-t border-black px-6 py-5 flex flex-col gap-4">
          {navLinks.map((item) => (
            <button key={item.label}
              onClick={() => { (item.action ?? (() => navigate(item.page)))(); setMobileOpen(false); }}
              className="font-['Cormorant_Garamond',serif] text-[20px] text-left text-black">
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

function SearchDialog({ open, onClose, navigate }: { open: boolean; onClose: () => void; navigate: (p: Page, data?: unknown) => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) { setQuery(""); return; }
    inputRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  const normalized = query.trim().toLowerCase();
  const results = useCatalogSearch(query, 8);
  if (!open) return null;

  const selectProduct = (product: Product) => {
    onClose();
    navigate("product", product);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/25" role="dialog" aria-modal="true" aria-label="Search fragrances" onMouseDown={onClose}>
      <div className="h-full w-[92vw] max-w-[430px] overflow-hidden border-r border-black/10 bg-[#fbf8f1] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="border-b border-black/10 px-5 pb-4 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div><p className="font-['IBM_Plex_Sans',sans-serif] text-[10px] font-semibold tracking-[0.2em] text-[#9a7d45]">CATALOG SEARCH</p><h2 className="font-['Cormorant_Garamond',serif] text-[30px] font-bold">Find a fragrance</h2></div>
            <button onClick={onClose} aria-label="Close search" className="rounded-full p-2 hover:bg-black/5"><X size={20} /></button>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-black/15 bg-white px-4 py-3">
            <Search size={19} strokeWidth={1.5} className="shrink-0 text-black/50" />
            <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, note, family, or brand..."
              className="w-full bg-transparent font-['IBM_Plex_Sans',sans-serif] text-[14px] outline-none placeholder:text-black/35" />
          </div>
        </div>
        <div className="h-[calc(100%-141px)] overflow-y-auto p-3">
          {normalized.length < 2 && <p className="px-3 py-8 text-center font-['IBM_Plex_Sans',sans-serif] text-[13px] text-black/45">Type at least two characters to search the collection.</p>}
          {normalized.length >= 2 && results.length === 0 && <p className="px-3 py-8 text-center font-['IBM_Plex_Sans',sans-serif] text-[13px] text-black/45">No fragrances matched “{query.trim()}”.</p>}
          {results.map((product) => (
            <button key={product.id} onClick={() => selectProduct(product)} className="flex w-full items-center gap-4 rounded-xl p-3 text-left transition-colors hover:bg-[#eee4d4]">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[#f0e6d7]"><img src={product.img} alt="" className="h-14 object-contain" /></div>
              <div className="min-w-0 flex-1">
                <p className="font-['Cormorant_Garamond',serif] text-[21px] font-semibold leading-tight">{product.name}</p>
                <p className="mt-1 truncate font-['IBM_Plex_Sans',sans-serif] text-[11px] text-black/50">{product.family} · {cleanNotes(product.notes)}</p>
              </div>
              <p className="shrink-0 font-['IBM_Plex_Sans',sans-serif] text-[12px] font-semibold">PHP {product.price}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
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
        <p className="font-['Cormorant_Garamond',serif] italic text-[#b6ada0] text-[14px]">Â© 2026 Decants by Joshua</p>
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

function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const lastPointer = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    if (!finePointer.matches) return;

    document.body.classList.add("joshua-custom-cursor");
    setEnabled(true);

    const show = () => cursorRef.current?.classList.remove("opacity-0");
    const hide = () => cursorRef.current?.classList.add("opacity-0");
    const draw = () => {
      rafId.current = null;
      const cursorElement = cursorRef.current;
      if (!cursorElement) return;

      cursorElement.style.transform = `translate3d(${lastPointer.current.x - 22}px, ${lastPointer.current.y - 22}px, 0)`;
      cursorElement.classList.remove("opacity-0");
    };
    const move = (event: PointerEvent) => {
      lastPointer.current = { x: event.clientX, y: event.clientY };
      if (rafId.current === null) {
        rafId.current = window.requestAnimationFrame(draw);
      }
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerenter", show);
    window.addEventListener("pointerleave", hide);

    return () => {
      document.body.classList.remove("joshua-custom-cursor");
      if (rafId.current !== null) window.cancelAnimationFrame(rafId.current);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerenter", show);
      window.removeEventListener("pointerleave", hide);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <style>{`
        @media (pointer: fine) {
          body.joshua-custom-cursor,
          body.joshua-custom-cursor * {
            cursor: none !important;
          }
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
function SearchResultsPage({ query, navigate }: { query: string; navigate: (p: Page, d?: unknown) => void }) {
  const normalized = query.trim().toLowerCase();
  const matches = useCatalogSearch(query, ALL_PRODUCTS.length);

  return (
    <div className="min-h-screen bg-[#fbf8f1] px-4 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-[1240px]">
        <p className="font-['IBM_Plex_Sans',sans-serif] text-[11px] font-semibold tracking-[0.2em] text-[#9a7d45]">SEARCH RESULTS</p>
        <h1 className="mt-2 font-['Cormorant_Garamond',serif] text-[46px] font-bold leading-none md:text-[68px]">
          {matches.length} {matches.length === 1 ? "MATCH" : "MATCHES"}
        </h1>
        <p className="mt-4 text-sm text-black/55">Showing every fragrance matching “{query}”.</p>
        {matches.length === 0 ? (
          <div className="mt-10 rounded-xl border border-black/10 bg-white p-8 text-center">
            <p className="font-['Cormorant_Garamond',serif] text-2xl">No fragrances matched your search.</p>
            <button onClick={() => navigate("collections")} className="mt-4 border-b border-black text-sm">Browse all collections</button>
          </div>
        ) : (
          <div className="mt-9 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {matches.map((product) => <CompactProductCard key={product.id} product={product} navigate={navigate} />)}
          </div>
        )}
      </div>
    </div>
  );
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
function BestSellersPage({ navigate }: { navigate: (p: Page, d?: unknown) => void }) {
  const bestSellers = ALL_PRODUCTS.filter((p) => p.bestSeller);
  const signature = bestSellers[0];
  const ranked = bestSellers.slice(1);

  return (
    <div className="min-h-screen bg-[#171614] text-[#f8f2e8]">
      <section className="relative grid overflow-hidden border-b border-[#c9b27a]/24 md:grid-cols-[120px_1fr]">
        <aside className="hidden border-r border-[#c9b27a]/24 px-6 py-10 md:flex md:flex-col md:justify-between">
          <p className="font-['IBM_Plex_Sans',sans-serif] text-[10px] font-semibold tracking-[0.22em] text-[#c9b27a] [writing-mode:vertical-rl]">BEST SELLERS INDEX</p>
          <p className="font-['Cormorant_Garamond',serif] text-[58px] leading-none text-[#f8f2e8]/10">01</p>
        </aside>
        <div className="relative px-4 py-10 md:px-10 md:py-20">
        <img src={imgDiscoveryBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#171614]/88 via-[#171614]/82 to-[#2b251d]" />
        <div className="relative mx-auto grid max-w-[1180px] items-center gap-12 md:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="font-['IBM_Plex_Sans',sans-serif] text-[12px] font-semibold tracking-[0.22em] text-[#c9b27a]">
              CUSTOMER FAVORITES
            </p>
            <h1 className="mt-4 font-['Cormorant_Garamond',serif] text-[38px] font-bold leading-none tracking-[0.04em] min-[390px]:text-[44px] md:text-[78px] md:tracking-[0.05em]">
              BEST SELLERS
            </h1>
            <p className="mt-5 max-w-[520px] font-['IBM_Plex_Sans',sans-serif] text-[16px] font-light leading-relaxed text-[#e7ded0]/72">
              The scents people come back for: polished fresh signatures, warm evening blends, and memorable decants chosen for daily wear.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {["Most Loved", "Gift Ready", "Signature Worthy"].map((tag) => (
                <span key={tag} className="border border-[#c9b27a]/40 px-4 py-2 font-['IBM_Plex_Sans',sans-serif] text-[11px] tracking-[0.16em] text-[#e7ded0]/86">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate("product", signature)}
            className="group relative min-h-[390px] overflow-hidden rounded-t-[34px] bg-[#f4eadc] text-left shadow-[0_34px_80px_rgba(0,0,0,0.34)] md:min-h-[520px] md:rounded-t-[64px]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,0.92),rgba(235,221,201,0.42)_42%,rgba(177,149,101,0.18)_100%)]" />
            <div className="relative flex h-full min-h-[390px] flex-col items-center justify-between px-5 pb-5 pt-6 md:min-h-[520px] md:px-8 md:pb-8 md:pt-10">
              <div className="flex w-full items-center justify-between">
                <span className="font-['IBM_Plex_Sans',sans-serif] text-[11px] font-semibold tracking-[0.18em] text-[#171717]/58">TOP PICK</span>
                <span className="flex items-center gap-1 text-[#b1945d]">
                  {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={15} fill="currentColor" strokeWidth={1.2} />)}
                </span>
              </div>
              <img
                src={signature.img}
                alt={signature.name}
                className="h-[205px] object-contain drop-shadow-[0_32px_34px_rgba(24,19,13,0.24)] transition-transform duration-700 md:h-[340px]"
              />
              <div className="w-full">
                <div className="mb-4 h-px w-full bg-[#171717]/12" />
                <p className="font-['Cormorant_Garamond',serif] text-[30px] font-semibold leading-none tracking-[0.035em] text-[#171717] md:text-[38px]">
                  {signature.name}
                </p>
                <div className="mt-3 flex items-end justify-between gap-5">
                  <p className="max-w-[300px] font-['IBM_Plex_Sans',sans-serif] text-[13px] font-light leading-relaxed text-[#171717]/62">
                    {cleanNotes(signature.notes)}. A refined first reach for anyone building a signature scent wardrobe.
                  </p>
                  <span className="shrink-0 font-['IBM_Plex_Sans',sans-serif] text-[13px] font-semibold tracking-[0.14em] text-[#171717]">
                    FROM PHP {signature.price}
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>
        </div>
      </section>

      <section className="bg-[#f8f2e8] px-4 py-10 text-[#171717] md:px-10 md:py-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="font-['IBM_Plex_Sans',sans-serif] text-[12px] font-semibold tracking-[0.18em] text-[#9a7d45]">RANKED FAVORITES</p>
              <h2 className="mt-2 font-['Cormorant_Garamond',serif] text-[34px] font-bold leading-none tracking-[0.04em] md:text-[60px] md:tracking-[0.05em]">
                MOST REQUESTED DECANTS
              </h2>
            </div>
            <button
              onClick={() => navigate("collections")}
              className="self-start border-b border-[#171717] pb-px font-['IBM_Plex_Sans',sans-serif] text-[12px] font-semibold tracking-[0.16em] transition-opacity hover:opacity-55 md:self-auto"
            >
              BROWSE ALL COLLECTIONS &rarr;
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
            {ranked.map((product, index) => (
              <CompactProductCard key={product.id} product={product} navigate={navigate} rank={index + 2} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
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
function ScentFinderPage({ navigate }: { navigate: (p: Page, data?: unknown) => void }) {
  const [preference, setPreference] = useState("");
  const [recommendations, setRecommendations] = useState<Array<{ productId: number; reason: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const localMatches = (text: string) => {
    const input = cleanText(text).toLowerCase();
    const words = input.split(/[^a-z0-9]+/).filter((word) => word.length > 2);
    const synonymGroups = [
      ["fresh", "citrus", "clean", "light", "summer", "hot", "humid", "manila", "office", "day", "breeze", "breezing", "airy", "cool"],
      ["woody", "wood", "forest", "cedar", "sandalwood", "oud", "earthy", "masculine"],
      ["warm", "spicy", "sweet", "vanilla", "amber", "cozy", "dessert", "gourmand"],
      ["dark", "night", "date", "evening", "party", "smoky", "smoke", "tobacco", "leather"],
      ["floral", "flower", "rose", "jasmine", "iris", "romantic"],
      ["fruity", "fruit", "berry", "apple", "grapefruit", "bergamot", "lemon", "orange"],
    ];
    const expanded = [...words];
    synonymGroups.forEach((group) => {
      if (group.some((term) => input.includes(term))) expanded.push(...group);
    });
    const scored = ALL_PRODUCTS.map((product) => {
      const searchable = cleanText([product.name, product.brand, product.family, product.category, product.notes, product.description].join(" ")).toLowerCase();
      const score = expanded.reduce((total, word) => total + (searchable.includes(word) ? 2 : 0), 0);
      return { productId: product.id, score, reason: `${product.family} character with ${cleanNotes(product.notes).toLowerCase()} notes makes this a strong match for what you described.` };
    }).sort((a, b) => b.score - a.score || a.productId - b.productId);
    const relevant = scored.filter((recommendation) => recommendation.score > 0);
    return (relevant.length >= 3 ? relevant : scored.filter((recommendation) => ALL_PRODUCTS.find((product) => product.id === recommendation.productId)?.bestSeller)).slice(0, 3);
  };

  const findScents = () => {
    setError("");
    setRecommendations([]);
    setLoading(true);
    setRecommendations(localMatches(preference));
    setLoading(false);
  };

  return <div className="min-h-screen bg-[#f6efe3] px-6 py-16 text-[#171717] md:px-10">
    <div className="mx-auto max-w-[980px]">
      <p className="font-['IBM_Plex_Sans',sans-serif] text-[11px] font-semibold tracking-[0.22em] text-[#9a7d45]">CATALOG-CONSTRAINED AI ADVISER</p>
      <h1 className="mt-3 font-['Cormorant_Garamond',serif] text-[58px] font-bold leading-none md:text-[82px]">FIND YOUR SCENT</h1>
      <p className="mt-6 max-w-2xl font-['IBM_Plex_Sans',sans-serif] text-[15px] font-light leading-relaxed text-black/60">Describe the mood, occasion, notes, climate, or fragrances you already enjoy. The adviser can recommend only products that are actually in our catalog.</p>
      <div className="mt-10 rounded-2xl border border-black/10 bg-[#fbf8f1] p-6 shadow-[0_18px_50px_rgba(42,34,25,0.08)] md:p-8">
        <textarea value={preference} onChange={(event) => setPreference(event.target.value)} rows={5}
          placeholder="Example: I want a clean everyday scent for warm Manila weather. I enjoy citrus and woods, but not very sweet vanilla."
          className="w-full resize-none rounded-xl border border-black/15 bg-white p-4 font-['IBM_Plex_Sans',sans-serif] text-[14px] leading-relaxed outline-none focus:border-black" />
        <DarkBtn onClick={() => void findScents()} disabled={loading || !preference.trim()} className="mt-4">{loading ? "MATCHING SCENTS..." : "FIND MY MATCHES"}</DarkBtn>
        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      </div>
      {recommendations.length > 0 && <div className="mt-10 grid gap-5 md:grid-cols-3">
        {recommendations.map((recommendation, index) => {
          const product = ALL_PRODUCTS.find((item) => item.id === recommendation.productId);
          if (!product) return null;
          return <button key={product.id} onClick={() => navigate("product", product)} className="rounded-xl border border-[#d7c8ae] bg-[#fbf8f1] p-5 text-left transition-transform hover:-translate-y-1">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-[#9a7d45]">MATCH {index + 1}</p>
            <img src={product.img} alt="" className="mx-auto my-5 h-36 object-contain" />
            <h2 className="font-['Cormorant_Garamond',serif] text-[26px] font-semibold">{product.name}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-black/60">{recommendation.reason}</p>
            <p className="mt-5 text-[11px] font-semibold tracking-[0.14em]">VIEW SCENT →</p>
          </button>;
        })}
      </div>}
    </div>
  </div>;
}

function DecantGuidePage() {
  const steps = [
    { n: "01", title: "Select", detail: "Choose 2ml, 5ml, or 10ml based on how long you want to live with the fragrance." },
    { n: "02", title: "Transfer", detail: "The scent is moved from the source bottle into a clean atomizer with a controlled decanting process." },
    { n: "03", title: "Seal", detail: "Every bottle is checked, capped, labeled, and prepared for travel." },
    { n: "04", title: "Protect", detail: "Your decants are wrapped and boxed so they arrive clean, secure, and ready to wear." },
  ];
  const sizes = [
    { size: "2ml", sprays: "~20", width: "32%", label: "First test", note: "For skin testing and first impressions." },
    { size: "5ml", sprays: "~50", width: "60%", label: "Wear week", note: "For learning the drydown and performance." },
    { size: "10ml", sprays: "~100", width: "100%", label: "Rotation", note: "For a scent you already want nearby." },
  ];

  return (
    <div className="min-h-screen bg-[#f6efe3] text-[#171717]">
      <section className="grid min-h-[calc(100svh-80px)] border-b border-[#171717] md:grid-cols-[220px_1fr]">
        <aside className="hidden border-r border-[#171717] px-7 py-10 md:flex md:flex-col md:justify-between">
          <p className="font-['IBM_Plex_Sans',sans-serif] text-[11px] font-semibold tracking-[0.22em] text-[#8f7444] [writing-mode:vertical-rl]">DECANT MANUAL</p>
          <div>
            <p className="font-['Cormorant_Garamond',serif] text-[76px] leading-none text-[#171717]/10">01</p>
            <div className="mt-4 h-[2px] w-20 bg-[#AE9766]" />
          </div>
        </aside>

        <div className="grid items-stretch md:grid-cols-[1fr_460px]">
          <div className="flex flex-col justify-center px-6 py-14 md:px-14 lg:px-20">
            <p className="font-['IBM_Plex_Sans',sans-serif] text-[12px] font-semibold tracking-[0.24em] text-[#9a7d45]">A PRACTICAL GUIDE TO SAMPLING</p>
            <h1 className="mt-5 max-w-[760px] font-['Cormorant_Garamond',serif] text-[56px] font-bold leading-[0.92] tracking-[0.04em] md:text-[88px] lg:text-[104px]">
              DECANT<br />GUIDE
            </h1>
            <p className="mt-8 max-w-[560px] font-['IBM_Plex_Sans',sans-serif] text-[17px] font-light leading-relaxed text-[#171717]/64">
              A decant is a smaller pour from a full fragrance bottle, made for testing, travel, and building taste without committing to the full size.
            </p>
            <div className="mt-12 grid max-w-[700px] border-y border-[#171717]/18 md:grid-cols-3">
              {["sample first", "wear properly", "store carefully"].map((item) => (
                <div key={item} className="border-b border-[#171717]/12 px-0 py-4 md:border-b-0 md:border-r md:border-[#171717]/12 md:px-5 md:first:pl-0 md:last:border-r-0">
                  <p className="font-['IBM_Plex_Sans',sans-serif] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#171717]/58">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[520px] overflow-hidden border-t border-[#171717] bg-[#eadfce] md:border-l md:border-t-0">
            <img src={imgWhyBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-[#eadfce]/70" />
            <div className="absolute left-10 right-10 top-12 border-t border-[#171717]/18" />
            <div className="absolute bottom-14 left-10 right-10 border-t border-[#171717]/18" />
            <div className="relative flex h-full min-h-[520px] items-center justify-center px-8">
              <div className="relative h-[360px] w-[260px]">
                <img src={imgBottle} alt="decant bottle" className="absolute left-1/2 top-1/2 h-[330px] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_30px_34px_rgba(35,28,20,0.24)]" />
                <div className="absolute -right-8 top-9 h-28 w-px bg-[#171717]/25" />
                <div className="absolute -right-12 top-7 font-['IBM_Plex_Sans',sans-serif] text-[10px] tracking-[0.18em] text-[#171717]/48 [writing-mode:vertical-rl]">ATOMIZER</div>
                <div className="absolute -left-10 bottom-12 h-24 w-px bg-[#171717]/25" />
                <div className="absolute -left-14 bottom-8 font-['IBM_Plex_Sans',sans-serif] text-[10px] tracking-[0.18em] text-[#171717]/48 [writing-mode:vertical-rl]">TRAVEL READY</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-10 grid gap-6 md:grid-cols-[0.72fr_1.28fr] md:items-end">
            <div>
              <p className="font-['IBM_Plex_Sans',sans-serif] text-[12px] font-semibold tracking-[0.2em] text-[#9a7d45]">THE PROCESS</p>
              <h2 className="mt-2 font-['Cormorant_Garamond',serif] text-[48px] font-bold leading-none tracking-[0.04em] md:text-[66px]">FROM BOTTLE TO POCKET</h2>
            </div>
            <p className="max-w-[560px] font-['IBM_Plex_Sans',sans-serif] text-[15px] font-light leading-relaxed text-[#171717]/62">
              Instead of stacked cards, think of this as the bench workflow: select, transfer, seal, protect. Each order follows the same sequence.
            </p>
          </div>

          <div className="border border-[#171717] bg-[#fbf8f1]">
            <div className="grid md:grid-cols-4">
              {steps.map((step, i) => (
                <div key={step.n} className="group relative min-h-[310px] border-b border-[#171717] p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
                  <div className="absolute inset-x-6 top-24 h-px bg-[#d8c8ac]" />
                  <div className="relative flex h-24 items-start justify-between">
                    <p className="font-['Cormorant_Garamond',serif] text-[68px] leading-none text-[#171717]/10">{step.n}</p>
                    <span className="mt-2 h-3 w-3 rounded-full border border-[#AE9766] bg-[#fbf8f1] transition-transform duration-500" />
                  </div>
                  <p className="mt-8 font-['Cormorant_Garamond',serif] text-[31px] font-semibold leading-none">{step.title}</p>
                  <p className="mt-4 font-['IBM_Plex_Sans',sans-serif] text-[13px] font-light leading-relaxed text-[#171717]/62">{step.detail}</p>
                  <p className="absolute bottom-5 left-6 font-['IBM_Plex_Sans',sans-serif] text-[10px] font-semibold tracking-[0.16em] text-[#9a7d45]">STEP {i + 1}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#171717] bg-[#e8dcc9] px-6 py-16 md:px-10">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-14 md:grid-cols-[340px_1fr] lg:grid-cols-[380px_1fr] lg:gap-28 xl:grid-cols-[430px_1fr] xl:gap-36">
            <div>
              <p className="font-['IBM_Plex_Sans',sans-serif] text-[12px] font-semibold tracking-[0.2em] text-[#9a7d45]">SIZE SYSTEM</p>
              <h2 className="mt-2 max-w-[360px] font-['Cormorant_Garamond',serif] text-[44px] font-bold leading-none tracking-[0.04em] lg:text-[48px] xl:text-[52px]">CHOOSE BY COMMITMENT</h2>
            </div>
            <div className="space-y-5">
              {sizes.map((size) => (
                <div key={size.size} className="grid items-center gap-8 border-b border-[#171717]/18 pb-5 md:grid-cols-[130px_1fr_110px]">
                  <p className="font-['Cormorant_Garamond',serif] text-[54px] leading-none text-[#171717] whitespace-nowrap">{size.size}</p>
                  <div>
                    <div className="h-3 bg-[#d4c3a8]">
                      <div className="h-full bg-[#AE9766]" style={{ width: size.width }} />
                    </div>
                    <div className="mt-3 grid gap-5 md:grid-cols-[180px_1fr]">
                      <p className="font-['Cormorant_Garamond',serif] text-[22px] leading-none">{size.label}</p>
                      <p className="font-['IBM_Plex_Sans',sans-serif] text-[13px] font-light text-[#171717]/62">{size.note}</p>
                    </div>
                  </div>
                  <p className="font-['IBM_Plex_Sans',sans-serif] text-[11px] font-semibold tracking-[0.16em] text-[#171717]/56">{size.sprays} SPRAYS</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
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
  const initialPage: Page = initialParams.get("payment") === "success" && import.meta.env.VITE_ENABLE_CHECKOUT === "true" ? "confirmation" : initialParams.get("view") === "collections" ? "collections" : initialParams.get("view") === "wishlist" ? "wishlist" : "home";
  const initialCollection = catalogFromSearch(window.location.search);
  const [page, setPage] = useState<Page>(initialPage);
  const [selectedProduct, setSelectedProduct] = useState<Product>(ALL_PRODUCTS[0]);
  const [selectedDiscoverySetId, setSelectedDiscoverySetId] = useState<number | null>(null);
  const [collectionFilters, setCollectionFilters] = useState<Partial<Filters>>(initialCollection);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [accountOpen, setAccountOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const pageRef = useRef<Page>(initialPage);
  const selectedProductRef = useRef<Product>(ALL_PRODUCTS[0]);
  const selectedDiscoverySetIdRef = useRef<number | null>(null);
  const collectionFiltersRef = useRef<Partial<Filters>>(initialCollection);
  const searchQueryRef = useRef("");

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
      searchQueryRef.current = data;
      setSearchQuery(data);
    }
    pageRef.current = p;
    setPage(p);
    const nextUrl = new URL(catalogUrl(window.location.href, p === "collections" ? normalizeCatalog(collectionFiltersRef.current) : null), window.location.origin);
    if (p === "wishlist") nextUrl.searchParams.set("view", "wishlist");
    window.history.pushState(createHistoryState(p), "", nextUrl.pathname + nextUrl.search);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      case "decantguide": return <DecantGuidePage />;
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
      <CustomCursor />
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
