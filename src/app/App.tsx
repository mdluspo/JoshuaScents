import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "motion/react";
import { ShoppingCart, Search, User, Menu, X, ChevronDown, ChevronUp, Star, Check, ArrowLeft, Plus, Minus, Package, Truck, Shield, Gift } from "lucide-react";

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
import imgCollProduct from "@/imports/Collections-1/2fead9763e6ed410e1c09e3afb4c82a010b439b5.png";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type Page = "home" | "collections" | "bestsellers" | "discovery" | "decantguide" | "faq" | "product" | "cart" | "checkout" | "confirmation";

interface Filters {
  categories: string[];
  families: string[];
  brands: string[];
  bestSellers: boolean;
}

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

function cleanNotes(notes: string) {
  return notes.replaceAll("â€¢", "•").replaceAll("â€”", "-").replaceAll("HermÃ¨s", "Hermes");
}

function DarkBtn({ onClick, children, className = "", type = "button" }: { onClick?: () => void; children: React.ReactNode; className?: string; type?: "button" | "submit" }) {
  return (
    <button type={type} onClick={onClick}
      className={`bg-[#1e1e1e] text-white font-['Cormorant_Garamond',serif] font-bold text-[15px] tracking-[0.12em] px-7 py-[11px] rounded-[5px] hover:bg-[#3d3d3d] transition-colors ${className}`}>
      {children}
    </button>
  );
}

// â”€â”€â”€ HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Header({ page, navigate, cartCount }: {
  page: Page;
  navigate: (p: Page, d?: unknown) => void;
  cartCount: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks: { label: string; page: Page; action?: () => void }[] = [
    { label: "Home", page: "home" },
    { label: "Collections", page: "collections" },
    { label: "Discovery Sets", page: "discovery" },
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
        <div className="flex items-center gap-4 shrink-0">
          <button className="hidden md:flex hover:opacity-50 transition-opacity"><Search size={20} strokeWidth={1.5} /></button>
          <button className="hidden md:flex hover:opacity-50 transition-opacity"><User size={20} strokeWidth={1.5} /></button>
          <button onClick={() => navigate("cart")} className="relative hover:opacity-50 transition-opacity">
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
  return (
    <button
      onClick={() => navigate("product", product)}
      className="group relative min-h-[238px] overflow-hidden rounded-[8px] border border-[#d9cdb9] bg-[#fbf8f1] p-5 text-left shadow-[0_18px_42px_rgba(42,34,25,0.08)] transition-shadow hover:shadow-[0_26px_58px_rgba(42,34,25,0.16)]"
    >
      {rank ? (
        <div className="pointer-events-none absolute right-5 top-5 z-0 w-[88px] text-right font-['Cormorant_Garamond',serif] text-[62px] leading-none text-[#171717]/7">
          {String(rank).padStart(2, "0")}
        </div>
      ) : null}
      <div className="relative z-10 flex h-full gap-5">
        <div className="flex h-[190px] w-[150px] shrink-0 items-center justify-center bg-[#f0e6d7]">
          <img src={product.img} alt={product.name} className="h-[162px] object-contain transition-transform duration-700 group-hover:scale-105" />
        </div>
        <div className={`flex min-h-[190px] flex-1 flex-col justify-between ${rank ? "pr-16" : ""}`}>
          <div>
            <p className="font-['IBM_Plex_Sans',sans-serif] text-[10px] font-semibold tracking-[0.16em] text-[#9a7d45]">{product.family.toUpperCase()}</p>
            <p className="mt-2 font-['Cormorant_Garamond',serif] text-[27px] font-semibold leading-none text-[#171717]">{product.name}</p>
            <p className="mt-3 font-['IBM_Plex_Sans',sans-serif] text-[13px] font-light leading-relaxed text-[#171717]/60">{cleanNotes(product.notes)}</p>
          </div>
          <div className="mt-5 flex items-center justify-between gap-4">
            <span className="font-['IBM_Plex_Sans',sans-serif] text-[13px] font-semibold text-[#171717]">From PHP {product.price}</span>
            <span className="font-['IBM_Plex_Sans',sans-serif] text-[10px] font-semibold tracking-[0.16em] text-[#171717]">VIEW &rarr;</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function CompactProductCard({ product, navigate, rank }: { product: Product; navigate: (p: Page, d?: unknown) => void; rank?: number }) {
  return (
    <button onClick={() => navigate("product", product)}
      className="group relative min-h-[360px] overflow-hidden rounded-[8px] border border-[#d7c8ae] bg-[#fbf8f1] p-4 text-left shadow-[0_14px_34px_rgba(42,34,25,0.09)] transition-shadow hover:shadow-[0_24px_52px_rgba(42,34,25,0.16)]">
      {rank ? (
        <div className="pointer-events-none absolute right-4 top-4 text-right font-['Cormorant_Garamond',serif] text-[48px] leading-none text-[#171717]/7">
          {String(rank).padStart(2, "0")}
        </div>
      ) : null}
      <div className="relative mb-4 flex h-[190px] items-center justify-center overflow-hidden bg-[#eee4d4]">
        <img src={product.img} alt={product.name}
          className="h-[168px] object-contain transition-transform duration-700 group-hover:scale-105" />
      </div>
      <div className="relative">
        <p className="font-['IBM_Plex_Sans',sans-serif] text-[10px] font-semibold tracking-[0.16em] text-[#9a7d45]">{product.family.toUpperCase()}</p>
        <p className="mt-2 font-['Cormorant_Garamond',serif] font-semibold text-[24px] text-[#171717] leading-none">{product.name}</p>
        <p className="mt-3 font-['IBM_Plex_Sans',sans-serif] font-light text-[13px] leading-relaxed text-[#171717]/60">{cleanNotes(product.notes)}</p>
        <div className="mt-7 flex items-center justify-between gap-3">
          <span className="font-['IBM_Plex_Sans',sans-serif] text-[13px] font-semibold text-[#171717]">From PHP {product.price}</span>
          <span className="font-['IBM_Plex_Sans',sans-serif] text-[10px] font-semibold tracking-[0.16em] text-[#171717]">VIEW &rarr;</span>
        </div>
      </div>
    </button>
  );
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
          cardControls.set({ y: 88, opacity: hideUntilReveal ? 0 : 1 });
          contentControls.set({ y: 36, opacity: 0 });
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
    cardControls.set({ y: 88, opacity: hideUntilReveal ? 0 : 1 });
    contentControls.set({ y: 36, opacity: 0 });
    void cardControls.start({
      y: 0,
      opacity: 1,
      transition: { duration: 1.28, ease: [0.19, 1, 0.22, 1] },
    }).then(() => {
      isAnimating.current = false;
    });
    void contentControls.start({
      y: 0,
      opacity: 1,
      transition: { duration: 0.92, delay: 0.2, ease: [0.19, 1, 0.22, 1] },
    });
  };

  return (
    <section
      ref={sectionRef}
      id={id}
      data-card-color={color}
      className={`relative min-h-[106svh] overflow-visible bg-transparent ${overlap ? "-mt-[88px]" : ""}`}
    >
      <motion.div
        initial={{ y: 88, opacity: hideUntilReveal ? 0 : 1 }}
        animate={cardControls}
        className={`relative z-10 w-full ${className}`}
      >
        {backgroundImage ? (
          <div className="absolute inset-0">
            <img src={backgroundImage} alt="" className="h-full w-full object-cover" />
            <div className={`absolute inset-0 ${backgroundOverlayClassName ?? ""}`} />
          </div>
        ) : null}
        <motion.div initial={{ y: 36, opacity: 0 }} animate={contentControls} className="relative h-full min-h-[inherit] w-full">
          {children}
        </motion.div>
      </motion.div>
    </section>
  );
}

// â”€â”€â”€ HOME PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function HomePage({ navigate }: { navigate: (p: Page, d?: unknown) => void }) {
  const bestSellers = ALL_PRODUCTS.filter((p) => p.bestSeller).slice(0, 3);

  const collections = [
    { label: "FRESH", subtitle: "Clean. Light. Everyday.", img: imgFresh, cat: "FRESH" },
    { label: "TIMBER & SMOKE", subtitle: "Warm. Rich. Timeless.", img: imgTimber, cat: "TIMBER & SMOKE" },
    { label: "GOLDEN VANILLA", subtitle: "Sweet. Smooth. Addictive.", img: imgVanilla, cat: "GOLDEN VANILLA" },
    { label: "AFTER HOURS", subtitle: "Bold. Intense. Unforgettable.", img: imgAfterHours, cat: "AFTER HOURS" },
  ];

  const featureItems = [
    { Icon: Shield, title: "Authentic Fragrances", desc: "Only genuine designer fragrances sourced from trusted suppliers." },
    { Icon: Package, title: "Premium Packaging", desc: "Every decant is packed carefully so it arrives clean, safe, and giftable." },
    { Icon: Truck, title: "Fast Shipping", desc: "Fast nationwide delivery with secure tracking from order to arrival." },
    { Icon: Gift, title: "Curated Selection", desc: "Handpicked fragrances for every mood, season, and occasion." },
  ];

  return (
    <div className="bg-[#39384f]">
      <div className="w-full bg-[#f8f2e8]">
        <div className="scroll-smooth">
          <section className="relative flex min-h-[100svh] flex-col items-center justify-start overflow-hidden bg-[#fbf8f1] px-6 pb-8 pt-8 md:px-20 md:pt-9 xl:px-28">
            <div className="absolute inset-0">
              <img src={imgDiscoveryBg} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[#fbf8f1]/82" />
            </div>
            <div className="relative z-10 flex w-full flex-1 flex-col items-center">
              <div className="mx-auto max-w-[620px] text-center">
                <h1 className="font-['Cormorant_Garamond',serif] text-[32px] font-bold leading-[1.08] tracking-[0.055em] text-[#171717] md:text-[44px] lg:text-[52px]">
                  FIND YOUR<br />SIGNATURE SCENT
                </h1>
                <p className="mx-auto mt-2 max-w-[420px] font-['IBM_Plex_Sans',sans-serif] text-[14px] font-light leading-relaxed text-[rgba(23,23,23,0.62)] md:text-[16px]">
                  Discover authentic designer fragrances through premium decants.
                </p>
                <div className="mt-5 flex justify-center">
                  <DarkBtn onClick={() => navigate("collections")} className="px-8 py-[10px] text-[14px]">SHOP COLLECTION</DarkBtn>
                </div>
              </div>
              <div className="relative mt-7 h-[260px] w-full max-w-[1640px] overflow-visible md:mt-8 md:h-[330px] xl:h-[360px]">
                {[
                  { left: "8%", height: "h-[128px] md:h-[178px] xl:h-[205px]", top: "top-[70px] md:top-[88px] xl:top-[96px]" },
                  { left: "28%", height: "h-[156px] md:h-[218px] xl:h-[250px]", top: "top-[42px] md:top-[52px] xl:top-[60px]" },
                  { left: "50%", height: "h-[205px] md:h-[278px] xl:h-[318px]", top: "-top-2 md:-top-4" },
                  { left: "72%", height: "h-[156px] md:h-[218px] xl:h-[250px]", top: "top-[42px] md:top-[52px] xl:top-[60px]" },
                  { left: "92%", height: "h-[128px] md:h-[178px] xl:h-[205px]", top: "top-[70px] md:top-[88px] xl:top-[96px]" },
                ].map((bottle, i) => (
                  <img
                    key={i}
                    src={imgBottle}
                    alt={i === 2 ? "fragrance decant bottle" : ""}
                    aria-hidden={i !== 2}
                    className={`absolute ${bottle.top} ${bottle.height} object-contain drop-shadow-[0_28px_32px_rgba(39,31,21,0.14)]`}
                    style={{
                      left: bottle.left,
                      transform: "translateX(-50%)",
                    }}
                  />
                ))}
              </div>
            </div>
          </section>

          <RevealSection
            color="#e9dece"
            backdropColor="#fbf8f1"
            backdropImage
            id="home-collections"
            overlap={false}
            hideUntilReveal
            className="flex min-h-[108svh] items-start overflow-hidden rounded-t-[64px] bg-[#e9dece] px-6 pb-28 pt-[76px] shadow-[0_-18px_40px_rgba(50,41,30,0.08)] md:px-20 md:pb-36 md:pt-[92px] xl:px-28"
          >
              <div className="w-full">
              <p className="text-center font-['IBM_Plex_Sans',sans-serif] text-[14px] font-light tracking-wide text-[rgba(23,23,23,0.58)]">
                Curated scents for every mood and occasion.
              </p>
              <h2 className="mb-8 text-center font-['Cormorant_Garamond',serif] text-[42px] font-bold leading-none tracking-[0.06em] text-[#171717] md:text-[62px]">
                FEATURED COLLECTIONS
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {collections.map((col) => (
                  <button
                    key={col.label}
                    onClick={() => navigate("collections", { category: col.cat })}
                    className="group relative aspect-[4/5] overflow-hidden rounded-[8px] text-left shadow-[0_20px_45px_rgba(28,23,17,0.18)]"
                  >
                    <img src={col.img} alt={col.label} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-5">
                      <div className="mb-3 h-[2px] w-9 bg-[#e0dfd8]" />
                      <p className="font-['Cormorant_Garamond',serif] text-[28px] font-bold leading-[0.98] tracking-[0.04em] text-[#f5efe5]">
                        {col.label}
                      </p>
                      <p className="mt-2 font-['IBM_Plex_Sans',sans-serif] text-[12px] font-light italic text-[#f5efe5]/80">{col.subtitle}</p>
                      <span className="mt-4 inline-block font-['IBM_Plex_Sans',sans-serif] text-[10px] font-semibold tracking-[0.16em] text-[#f5efe5]">
                        SHOP NOW &rarr;
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              </div>
          </RevealSection>

          <RevealSection
            color="#f7f1e7"
            backdropColor="#e9dece"
            className="flex min-h-[108svh] items-start overflow-hidden rounded-t-[64px] bg-[#f7f1e7] px-6 pb-28 pt-[76px] shadow-[0_-18px_40px_rgba(50,41,30,0.08)] md:px-20 md:pb-36 md:pt-[92px] xl:px-28"
          >
            <div className="w-full">
              <p className="text-center font-['IBM_Plex_Sans',sans-serif] text-[14px] font-light text-[rgba(23,23,23,0.58)]">
                Our most-loved fragrances.
              </p>
              <h2 className="mb-10 text-center font-['Cormorant_Garamond',serif] text-[42px] font-bold leading-none tracking-[0.06em] text-[#171717] md:text-[60px]">
                BEST SELLERS
              </h2>
              <div className="mx-auto grid max-w-[1120px] items-center gap-8 sm:grid-cols-3">
                {bestSellers.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => navigate("product", p)}
                    className={`group rounded-[22px] border border-white/70 bg-[#f3ede3] p-6 text-center transition-shadow hover:shadow-[0_22px_52px_rgba(35,28,20,0.18)] ${
                      i === 1
                        ? "shadow-[0_22px_56px_rgba(35,28,20,0.14)] sm:scale-110"
                        : "shadow-[0_14px_34px_rgba(35,28,20,0.1)]"
                    }`}
                  >
                    <div className={`mb-4 flex items-center justify-center overflow-hidden ${i === 1 ? "h-[230px]" : "h-[190px]"}`}>
                      <img src={p.img} alt={p.name} className={`${i === 1 ? "h-[215px]" : "h-[170px]"} object-contain transition-transform duration-700 group-hover:scale-105`} />
                    </div>
                    <p className="font-['Cormorant_Garamond',serif] text-[20px] font-semibold leading-tight text-[#171717]">{p.name}</p>
                    <p className="font-['IBM_Plex_Sans',sans-serif] text-[12px] font-light text-[rgba(23,23,23,0.58)]">{p.notes}</p>
                    <p className="mt-1 font-['IBM_Plex_Sans',sans-serif] text-[12px] font-semibold text-[#171717]">From PHP {p.price}</p>
                    <span className="mt-3 inline-block font-['IBM_Plex_Sans',sans-serif] text-[10px] font-semibold tracking-[0.14em] text-[#171717]">
                      EXPLORE &rarr;
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => navigate("bestsellers")}
                  className="font-['IBM_Plex_Sans',sans-serif] text-[12px] font-semibold tracking-[0.16em] text-[#171717] border-b border-[#171717] pb-px hover:opacity-55 transition-opacity"
                >
                  VIEW ALL BEST SELLERS &rarr;
                </button>
              </div>
            </div>
          </RevealSection>

          <RevealSection
            color="#e5dac9"
            backdropColor="#f7f1e7"
            backgroundImage={imgWhyBg}
            backgroundOverlayClassName="bg-[#e5dac9]/89"
            className="flex min-h-[106svh] items-center overflow-hidden rounded-t-[64px] bg-[#e5dac9] pb-24 pt-[76px] shadow-[0_-18px_40px_rgba(50,41,30,0.08)] md:pb-32 md:pt-[92px]"
          >
            <div className="relative mx-auto w-full max-w-[1050px] px-6 md:px-20 xl:px-0">
              <h2 className="text-center font-['Cormorant_Garamond',serif] text-[40px] font-bold leading-none tracking-[0.06em] text-[#171717] md:text-[58px]">
                WHY DECANTS BY JOSHUA
              </h2>
              <p className="mx-auto mt-3 max-w-[620px] text-center font-['IBM_Plex_Sans',sans-serif] text-[15px] font-light leading-relaxed text-[rgba(23,23,23,0.62)]">
                Crafted to make fragrance discovery simple, authentic, and memorable.
              </p>
              <div className="mt-12 grid gap-8 sm:grid-cols-2">
                {featureItems.map(({ Icon, title, desc }) => (
                  <div
                    key={title}
                    className="flex items-start gap-4"
                  >
                    <Icon size={30} strokeWidth={1.4} className="mt-1 shrink-0 text-[#171717]" />
                    <div>
                      <p className="font-['Cormorant_Garamond',serif] text-[28px] font-bold leading-tight text-[#171717]">{title}</p>
                      <p className="mt-1 max-w-[340px] font-['IBM_Plex_Sans',sans-serif] text-[13px] font-light leading-relaxed text-[rgba(23,23,23,0.6)]">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-12 text-center font-['IBM_Plex_Sans',sans-serif] text-[14px] font-light text-[rgba(23,23,23,0.58)]">
                We believe discovering fragrance should be as memorable as wearing it.
              </p>
            </div>
          </RevealSection>

          <RevealSection
            color="#e5dac9"
            backdropColor="#e5dac9"
            triggerRootMargin="0px 0px 32% 0px"
            className="flex min-h-[112svh] items-stretch overflow-visible bg-transparent"
          >
            <div className="relative flex min-h-[112svh] w-full flex-col overflow-hidden rounded-t-[64px] bg-[#fbf8f1] shadow-[0_24px_70px_rgba(42,34,25,0.12)]">
              <img src={imgDiscoveryBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[#fbf8f1]/68" />
              <div className="relative grid flex-1 items-center gap-8 px-8 pb-12 pt-16 md:grid-cols-[0.85fr_1fr_1fr] md:px-20 lg:px-24">
                <div className="self-start md:self-center">
                  <h2 className="font-['Cormorant_Garamond',serif] text-[40px] font-bold leading-none tracking-[0.06em] text-[#171717] md:text-[58px]">
                    DISCOVERY SETS
                  </h2>
                  <div className="my-7 h-[2px] w-28 bg-[#b6a06c]" />
                  <p className="max-w-[360px] font-['Cormorant_Garamond',serif] text-[17px] italic leading-relaxed text-[rgba(23,23,23,0.6)]">
                    Curated fragrance journeys for every occasion.
                  </p>
                  <button
                    onClick={() => window.scrollBy({ top: window.innerHeight * 0.85, behavior: "smooth" })}
                    className="mt-40 hidden text-left font-['Cormorant_Garamond',serif] text-[17px] tracking-wide text-[#171717] md:block"
                  >
                    SCROLL TO EXPLORE
                    <span className="mt-3 block h-10 w-px bg-[#171717] translate-x-12" />
                    <span className="ml-[43px] block h-4 w-4 rounded-full border border-[#171717]" />
                  </button>
                </div>
                <img
                  src={imgBottle}
                  alt="starter collection decant"
                  className="mx-auto h-[440px] rotate-[-9deg] object-contain drop-shadow-[0_30px_42px_rgba(30,24,18,0.22)] md:h-[660px] xl:h-[760px]"
                />
                <div className="relative">
                  <div className="mb-5 flex items-center gap-5">
                    <div className="h-px w-24 bg-[#cbbd9f]" />
                    <span className="font-['Cormorant_Garamond',serif] text-[52px] font-semibold leading-none text-[#171717]">01</span>
                    <div className="h-px flex-1 bg-[#cbbd9f]" />
                  </div>
                  <h3 className="font-['Cormorant_Garamond',serif] text-[38px] font-semibold leading-[0.98] tracking-[0.04em] text-[#171717] md:text-[54px]">
                    THE STARTER<br />COLLECTION
                  </h3>
                  <p className="mt-5 max-w-[380px] font-['IBM_Plex_Sans',sans-serif] text-[16px] font-light leading-relaxed text-[rgba(23,23,23,0.64)]">
                    Five timeless fragrances to begin your journey.
                  </p>
                  <button
                    onClick={() => navigate("discovery")}
                    className="mt-12 font-['Cormorant_Garamond',serif] text-[22px] text-[#171717] tracking-wide border-b border-[#171717] pb-px hover:opacity-55 transition-opacity"
                  >
                    EXPLORE SET
                  </button>
                  <div className="absolute right-0 top-5 hidden space-y-7 font-['IBM_Plex_Sans',sans-serif] text-[12px] text-[rgba(23,23,23,0.55)] lg:block">
                    {["01", "02", "03", "04"].map((n) => <p key={n}>{n}</p>)}
                  </div>
                </div>
              </div>
              <div className="relative grid items-center gap-5 bg-[#ded3bf] px-8 py-8 md:grid-cols-[auto_1fr_auto_1fr_auto] md:px-14">
                <button className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#a79368] text-[#171717]" aria-label="Previous discovery set">
                  <ArrowLeft size={30} strokeWidth={1.4} />
                </button>
                <div className="text-center">
                  <p className="font-['Cormorant_Garamond',serif] text-[34px] text-[#171717]">02</p>
                  <p className="font-['Cormorant_Garamond',serif] text-[22px] leading-tight text-[#171717]">WANDERLUST<br />COLLECTION</p>
                  <p className="font-['Cormorant_Garamond',serif] text-[13px] text-[rgba(23,23,23,0.62)]">3 Fragrances</p>
                </div>
                <button className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#a79368] font-['IBM_Plex_Sans',sans-serif] text-[34px] font-bold text-[#171717]" aria-label="Pause discovery carousel">
                  ||
                </button>
                <div className="text-center">
                  <p className="font-['Cormorant_Garamond',serif] text-[34px] text-[#171717]">03</p>
                  <p className="font-['Cormorant_Garamond',serif] text-[22px] leading-tight text-[#171717]">VELVET UNDERGROUND<br />COLLECTION</p>
                  <p className="font-['Cormorant_Garamond',serif] text-[13px] text-[rgba(23,23,23,0.62)]">4 Fragrances</p>
                </div>
                <button className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#a79368] text-[#171717]" aria-label="Next discovery set">
                  <ArrowLeft size={30} strokeWidth={1.4} className="rotate-180" />
                </button>
                <div className="col-span-full mt-2 flex justify-center gap-2">
                  {[0, 1, 2, 3, 4].map((dot) => (
                    <span key={dot} className={`h-2 w-2 rounded-full ${dot === 0 ? "bg-[#b8aa7d]" : "border border-[#b8aa7d]"}`} />
                  ))}
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ COLLECTIONS PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CollectionsPage({ navigate, initialFilters }: {
  navigate: (p: Page, d?: unknown) => void;
  initialFilters?: Partial<Filters>;
}) {
  const CATEGORIES = ["FRESH", "TIMBER & SMOKE", "GOLDEN VANILLA", "AFTER HOURS", "EVERYDAY", "SUMMER"];
  const FAMILIES = ["Fresh", "Woody", "Warm & Spicy", "Floral", "Oriental", "Citrus"];
  const BRANDS = ["All Brands", "Creed", "PRMNKY", "HSI", "JEM", "ZENIN"];

  const [selectedCats, setSelectedCats] = useState<string[]>(initialFilters?.categories ?? []);
  const [selectedFamilies, setSelectedFamilies] = useState<string[]>(initialFilters?.families ?? []);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialFilters?.brands ?? []);
  const [bestSellersOnly, setBestSellersOnly] = useState(initialFilters?.bestSellers ?? false);
  const [showMoreBrands, setShowMoreBrands] = useState(false);
  const [sortBy, setSortBy] = useState("Featured");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const clearAll = () => {
    setSelectedCats([]); setSelectedFamilies([]); setSelectedBrands([]);
    setBestSellersOnly(false); setMinPrice(""); setMaxPrice("");
  };

  const visibleBrands = showMoreBrands ? BRANDS : BRANDS.slice(0, 5);

  let filtered = ALL_PRODUCTS;
  if (bestSellersOnly) filtered = filtered.filter((p) => p.bestSeller);
  if (selectedCats.length) filtered = filtered.filter((p) => selectedCats.includes(p.category));
  if (selectedFamilies.length) filtered = filtered.filter((p) => selectedFamilies.includes(p.family));
  if (selectedBrands.length && !selectedBrands.includes("All Brands")) {
    filtered = filtered.filter((p) => selectedBrands.includes(p.brand));
  }
  if (minPrice) filtered = filtered.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) filtered = filtered.filter((p) => p.price <= Number(maxPrice));

  if (sortBy === "Price: Low to High") filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sortBy === "Price: High to Low") filtered = [...filtered].sort((a, b) => b.price - a.price);

  const CheckRow = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
    <label className="flex items-center gap-2.5 cursor-pointer group mb-1.5">
      <div onClick={onChange}
        className={`w-4 h-4 border rounded-sm flex items-center justify-center flex-shrink-0 transition-colors ${checked ? "bg-[#171717] border-[#171717]" : "border-[rgba(0,0,0,0.3)] group-hover:border-[#171717]"}`}>
        {checked && <Check size={10} strokeWidth={3} className="text-white" />}
      </div>
      <span className="font-['IBM_Plex_Sans',sans-serif] font-light text-[13px] text-[#171717] leading-tight">{label}</span>
    </label>
  );

  return (
    <div className="bg-[#fbf8f1] min-h-screen">
      {/* Page title */}
      <div className="border-b border-[#171717]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 pt-12 pb-9 text-center">
        <p className="font-['IBM_Plex_Sans',sans-serif] text-[12px] font-semibold tracking-[0.22em] text-[#9a7d45]">FRAGRANCE INDEX</p>
        <h1 className="font-['Cormorant_Garamond',serif] font-bold text-[52px] md:text-[70px] text-[#171717] tracking-[0.04em] mt-2 mb-3 leading-none">
          {bestSellersOnly ? "BEST SELLERS" : "COLLECTIONS"}
        </h1>
        <p className="mx-auto max-w-[520px] font-['IBM_Plex_Sans',sans-serif] font-light text-[16px] text-[rgba(23,23,23,0.65)]">
          {bestSellersOnly ? "Our most-loved fragrances, chosen by our community." : "Explore our curated selection of luxury decants."}
        </p>
        <div className="mx-auto mt-7 h-px max-w-[680px] bg-[#171717]/16" />
      </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-10 pb-20 flex gap-8">
        {/* Sidebar */}
        <aside className="hidden md:block w-[220px] flex-shrink-0 border-r border-[#171717]/18 pr-6">
          <div className="flex items-center justify-between mb-5 border-b border-[#171717]/18 pb-4">
            <p className="font-['IBM_Plex_Sans',sans-serif] font-semibold text-[14px] tracking-[0.14em] text-[#171717]">FILTER</p>
            <button onClick={clearAll} className="font-['IBM_Plex_Sans',sans-serif] font-light text-[12px] text-[rgba(23,23,23,0.5)] hover:text-[#171717] transition-colors">Clear All</button>
          </div>

          {/* Best Sellers toggle */}
          <CheckRow label="Best Sellers" checked={bestSellersOnly} onChange={() => setBestSellersOnly(!bestSellersOnly)} />

          <div className="h-[1px] bg-[rgba(0,0,0,0.1)] my-4" />

          {/* Category */}
          <p className="font-['IBM_Plex_Sans',sans-serif] font-semibold text-[12px] tracking-[0.12em] text-[#171717] mb-3">CATEGORY</p>
          {CATEGORIES.map((c) => (
            <CheckRow key={c} label={c.charAt(0) + c.slice(1).toLowerCase().replace(" & ", " & ")} checked={selectedCats.includes(c)} onChange={() => toggle(selectedCats, setSelectedCats, c)} />
          ))}

          <div className="h-[1px] bg-[rgba(0,0,0,0.1)] my-4" />

          {/* Fragrance Family */}
          <p className="font-['IBM_Plex_Sans',sans-serif] font-semibold text-[12px] tracking-[0.12em] text-[#171717] mb-3">FRAGRANCE FAMILY</p>
          {FAMILIES.map((f) => (
            <CheckRow key={f} label={f} checked={selectedFamilies.includes(f)} onChange={() => toggle(selectedFamilies, setSelectedFamilies, f)} />
          ))}

          <div className="h-[1px] bg-[rgba(0,0,0,0.1)] my-4" />

          {/* Brand */}
          <p className="font-['IBM_Plex_Sans',sans-serif] font-semibold text-[12px] tracking-[0.12em] text-[#171717] mb-3">BRAND</p>
          {visibleBrands.map((b) => (
            <CheckRow key={b} label={b} checked={selectedBrands.includes(b)} onChange={() => toggle(selectedBrands, setSelectedBrands, b)} />
          ))}
          <button onClick={() => setShowMoreBrands(!showMoreBrands)}
            className="font-['IBM_Plex_Sans',sans-serif] font-light text-[12px] text-[rgba(23,23,23,0.55)] hover:text-[#171717] transition-colors flex items-center gap-1 mt-1">
            {showMoreBrands ? "View less" : "View more"} <ChevronDown size={12} className={showMoreBrands ? "rotate-180" : ""} />
          </button>

          <div className="h-[1px] bg-[rgba(0,0,0,0.1)] my-4" />

          {/* Price */}
          <p className="font-['IBM_Plex_Sans',sans-serif] font-semibold text-[12px] tracking-[0.12em] text-[#171717] mb-3">PRICE</p>
          <CheckRow label="Any Price" checked={!minPrice && !maxPrice} onChange={() => { setMinPrice(""); setMaxPrice(""); }} />
          <div className="mt-2 space-y-2">
            <div>
              <p className="font-['IBM_Plex_Sans',sans-serif] text-[10px] tracking-wide text-[rgba(23,23,23,0.5)] mb-1">MIN</p>
              <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="PHP"
                className="w-full border border-[rgba(0,0,0,0.2)] rounded px-2 py-1.5 font-['IBM_Plex_Sans',sans-serif] text-[12px] bg-white focus:outline-none focus:border-[#171717]" />
            </div>
            <div>
              <p className="font-['IBM_Plex_Sans',sans-serif] text-[10px] tracking-wide text-[rgba(23,23,23,0.5)] mb-1">MAX</p>
              <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="PHP"
                className="w-full border border-[rgba(0,0,0,0.2)] rounded px-2 py-1.5 font-['IBM_Plex_Sans',sans-serif] text-[12px] bg-white focus:outline-none focus:border-[#171717]" />
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6 border-b border-[#171717]/16 pb-4">
            <p className="font-['IBM_Plex_Sans',sans-serif] font-light text-[14px] text-[rgba(23,23,23,0.6)]">
              {filtered.length} Decant{filtered.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <p className="font-['IBM_Plex_Sans',sans-serif] font-light text-[13px] text-[rgba(23,23,23,0.55)]">Sort By:</p>
              <div className="relative">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none font-['IBM_Plex_Sans',sans-serif] text-[13px] text-[#171717] border border-[rgba(0,0,0,0.2)] rounded px-3 py-1.5 pr-7 bg-white focus:outline-none focus:border-[#171717] cursor-pointer">
                  <option>Featured</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#8D8579]" />
              </div>
            </div>
          </div>

          {/* Product grid â€” 4 cols */}
          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-['Cormorant_Garamond',serif] text-[28px] text-[rgba(23,23,23,0.4)]">No products match your filters.</p>
              <button onClick={clearAll} className="mt-4 font-['IBM_Plex_Sans',sans-serif] text-[13px] text-[#171717] border-b border-[#171717] pb-px">Clear all filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {filtered.map((p) => <CompactProductCard key={p.id} product={p} navigate={navigate} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ DISCOVERY SETS PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        <div className="relative px-6 py-16 md:px-10 md:py-20">
        <img src={imgDiscoveryBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#171614]/88 via-[#171614]/82 to-[#2b251d]" />
        <div className="relative mx-auto grid max-w-[1180px] items-center gap-12 md:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="font-['IBM_Plex_Sans',sans-serif] text-[12px] font-semibold tracking-[0.22em] text-[#c9b27a]">
              CUSTOMER FAVORITES
            </p>
            <h1 className="mt-4 font-['Cormorant_Garamond',serif] text-[50px] font-bold leading-none tracking-[0.05em] md:text-[78px]">
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
            className="group relative min-h-[520px] overflow-hidden rounded-t-[64px] bg-[#f4eadc] text-left shadow-[0_34px_80px_rgba(0,0,0,0.34)]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,0.92),rgba(235,221,201,0.42)_42%,rgba(177,149,101,0.18)_100%)]" />
            <div className="relative flex h-full min-h-[520px] flex-col items-center justify-between px-8 pb-8 pt-10">
              <div className="flex w-full items-center justify-between">
                <span className="font-['IBM_Plex_Sans',sans-serif] text-[11px] font-semibold tracking-[0.18em] text-[#171717]/58">TOP PICK</span>
                <span className="flex items-center gap-1 text-[#b1945d]">
                  {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={15} fill="currentColor" strokeWidth={1.2} />)}
                </span>
              </div>
              <img
                src={signature.img}
                alt={signature.name}
                className="h-[300px] object-contain drop-shadow-[0_32px_34px_rgba(24,19,13,0.24)] transition-transform duration-700 group-hover:scale-105 md:h-[340px]"
              />
              <div className="w-full">
                <div className="mb-4 h-px w-full bg-[#171717]/12" />
                <p className="font-['Cormorant_Garamond',serif] text-[38px] font-semibold leading-none tracking-[0.035em] text-[#171717]">
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

      <section className="bg-[#f8f2e8] px-6 py-16 text-[#171717] md:px-10 md:py-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="font-['IBM_Plex_Sans',sans-serif] text-[12px] font-semibold tracking-[0.18em] text-[#9a7d45]">RANKED FAVORITES</p>
              <h2 className="mt-2 font-['Cormorant_Garamond',serif] text-[42px] font-bold leading-none tracking-[0.05em] md:text-[60px]">
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

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {ranked.map((product, index) => (
              <ProductCard key={product.id} product={product} navigate={navigate} rank={index + 2} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function DiscoveryPage({ navigate }: { navigate: (p: Page, d?: unknown) => void }) {
  return (
    <div className="bg-[#f7f5f1] min-h-screen">
      {/* Header section */}
      <section className="border-b border-[#171717] px-6 pb-10 pt-14 text-center">
        <div className="mx-auto mb-7 grid max-w-[760px] grid-cols-3 border-y border-[#171717]/16 py-3">
          {["DISCOVERY", "CURATED", "GIFT READY"].map((item) => (
            <p key={item} className="border-r border-[#171717]/12 font-['IBM_Plex_Sans',sans-serif] text-[10px] font-semibold tracking-[0.18em] text-[#9a7d45] last:border-r-0">
              {item}
            </p>
          ))}
        </div>
        <h1 className="font-['Cormorant_Garamond',serif] font-bold text-[54px] md:text-[70px] text-[#171717] tracking-[0.04em] mb-3">DISCOVERY SETS</h1>
        <p className="font-['IBM_Plex_Sans',sans-serif] font-light text-[18px] text-[rgba(23,23,23,0.65)] tracking-wide">
          Curated fragrance journeys for every occasion.
        </p>

        {/* Feature columns */}
        <div className="flex flex-col md:flex-row justify-center gap-14 mt-12">
          {[
            {
              icon: (
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1">
                  <path d="M9 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2h-2M9 3a2 2 0 012-2h2a2 2 0 012 2M9 3h6" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              ),
              title: "Curated Selections",
              desc: "Handpicked decants to explore and find your signature",
            },
            {
              icon: (
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ),
              title: "Premium Quality",
              desc: "100% Premium quality decants",
            },
            {
              icon: <Gift size={52} strokeWidth={1.1} />,
              title: "Perfect to Gift",
              desc: "Beautifully packaged and ready to impress",
            },
          ].map(({ icon, title, desc }, i) => (
            <div key={i} className="flex flex-col items-center max-w-[220px] mx-auto text-left">
              <div className="flex items-center gap-3 mb-3 w-full">
                <div className="text-[#171717] flex-shrink-0">{icon}</div>
                <div>
                  <p className="font-['Cormorant_Garamond',serif] font-semibold text-[22px] text-[#171717] leading-tight">{title}</p>
                  <p className="font-['IBM_Plex_Sans',sans-serif] font-light text-[13px] text-[rgba(23,23,23,0.65)] leading-relaxed mt-1">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Explore Our Sets */}
      <section className="px-6 md:px-12 py-16">
        <div className="max-w-[1180px] mx-auto">
          <div className="mb-12 text-center">
            <p className="font-['IBM_Plex_Sans',sans-serif] text-[12px] font-semibold tracking-[0.18em] text-[#9a7d45]">EXPLORE OUR SETS</p>
            <h2 className="mt-2 font-['Cormorant_Garamond',serif] font-bold text-[42px] text-[#171717] tracking-[0.05em] md:text-[60px] leading-none">SCENT JOURNEYS</h2>
          </div>

          <div className="space-y-10">
            {DISCOVERY_SETS.map((set, i) => {
              const setProducts = ALL_PRODUCTS.filter((p) => set.productIds.includes(p.id));
              const heroProduct = setProducts[0];
              const reverse = i % 2 === 1;
              return (
                <div key={set.id} className={`group relative grid items-stretch gap-0 overflow-hidden rounded-[8px] border border-[#d9cdb9] bg-[#fbf8f1] shadow-[0_24px_70px_rgba(42,34,25,0.12)] transition-transform duration-500 hover:-translate-y-1 md:grid-cols-[1.05fr_0.95fr] ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
                  <div className={`relative flex min-h-[390px] items-center justify-center overflow-hidden bg-[#efe3d1] p-8 ${reverse ? "md:order-2" : ""}`}>
                      <img src={imgDiscoveryBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-26" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_44%,rgba(255,255,255,0.64),rgba(239,227,209,0.58)_38%,rgba(183,156,111,0.22)_100%)]" />
                      <div className="absolute left-[10%] top-[13%] h-px w-[78%] rotate-[-8deg] bg-[#b59a63]/25" />
                      <div className="absolute bottom-[18%] left-[16%] h-[56px] w-[68%] rounded-full bg-[#4f4436]/12 blur-2xl" />
                      <div className="relative h-[300px] w-full max-w-[360px]">
                        {setProducts.slice(0, 5).map((p, idx) => (
                          <button
                            key={p.id}
                            onClick={() => navigate("product", p)}
                            className="absolute bottom-0 transition-all duration-700 hover:-translate-y-3"
                            style={{
                              left: `${idx * 19}%`,
                              zIndex: 10 - idx,
                              transform: `rotate(${(idx - 2) * 5}deg)`,
                            }}
                          >
                            <img
                              src={p.img}
                              alt={p.name}
                              className={`${idx === 0 ? "h-[270px]" : "h-[210px]"} object-contain drop-shadow-[0_24px_28px_rgba(35,28,20,0.22)]`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  <div className="relative flex min-h-[390px] flex-col justify-between p-7 md:p-9">
                    <div className="pointer-events-none absolute right-7 top-6 font-['Cormorant_Garamond',serif] text-[92px] leading-none text-[#171717]/7">0{i + 1}</div>
                    <div className="relative">
                      <div className="mb-5 h-[2px] w-14 bg-[#AE9766]" />
                      <p className="font-['Cormorant_Garamond',serif] text-[38px] font-semibold leading-none tracking-[0.03em] text-[#171717]">{set.name}</p>
                      <p className="mt-3 max-w-[420px] font-['IBM_Plex_Sans',sans-serif] text-[14px] font-light leading-relaxed text-[#171717]/62">{set.subtitle}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {set.tags.map((t) => (
                          <span key={t} className="border border-[#c9b27a]/45 px-3 py-1 font-['IBM_Plex_Sans',sans-serif] text-[10px] tracking-[0.12em] text-[#171717]">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="relative mt-9">
                      <div className="mb-6 grid gap-3">
                        {setProducts.slice(0, 3).map((p, idx) => (
                          <button key={p.id} onClick={() => navigate("product", p)} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 border-b border-[#d9cdb9] pb-3 text-left transition-opacity hover:opacity-60">
                            <span className="font-['Cormorant_Garamond',serif] text-[25px] text-[#AE9766]">0{idx + 1}</span>
                            <span>
                              <span className="block font-['Cormorant_Garamond',serif] text-[20px] leading-none text-[#171717]">{p.name}</span>
                              <span className="mt-1 block font-['IBM_Plex_Sans',sans-serif] text-[11px] text-[#171717]/50">{cleanNotes(p.notes)}</span>
                            </span>
                            <span className="font-['IBM_Plex_Sans',sans-serif] text-[10px] font-semibold tracking-[0.14em]">VIEW</span>
                          </button>
                        ))}
                      </div>
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className="font-['IBM_Plex_Sans',sans-serif] text-[12px] font-light text-[#171717]/55">{set.count} Fragrances</p>
                          <p className="font-['IBM_Plex_Sans',sans-serif] text-[20px] font-semibold text-[#171717]">PHP {set.price}</p>
                        </div>
                        <button onClick={() => navigate("collections")} className="border-b border-[#171717] pb-px font-['IBM_Plex_Sans',sans-serif] text-[11px] font-semibold tracking-[0.16em] text-[#171717] hover:opacity-55">EXPLORE SET &rarr;</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

// â”€â”€â”€ PRODUCT DETAIL PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ProductPage({ product, navigate, addToCart }: {
  product: Product;
  navigate: (p: Page, d?: unknown) => void;
  addToCart: (p: Product, size: string, price: number) => void;
}) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart(product, selectedSize.label, selectedSize.price);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const relatedProducts = ALL_PRODUCTS.filter((p) => p.id !== product.id && p.family === product.family).slice(0, 4);

  return (
    <div className="bg-[#f7f5f1] min-h-screen">
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <button onClick={() => navigate("collections")}
          className="flex items-center gap-1.5 font-['IBM_Plex_Sans',sans-serif] text-[13px] text-[rgba(23,23,23,0.5)] hover:text-[#171717] transition-colors mb-10">
          <ArrowLeft size={13} /> Collections
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          {/* Left â€” image */}
          <div>
            <div className="bg-[#f0ece4] rounded-[28px] aspect-square flex items-center justify-center shadow-[0px_8px_40px_rgba(0,0,0,0.07)]">
              <img src={product.img} alt={product.name} className="h-[65%] object-contain" />
            </div>
          </div>

          {/* Right â€” info */}
          <div className="flex flex-col justify-center">
            <GoldBar />
            <p className="font-['IBM_Plex_Sans',sans-serif] font-light text-[11px] tracking-[0.2em] text-[rgba(23,23,23,0.45)] uppercase mt-4 mb-1">{product.brand}</p>
            <h1 className="font-['Cormorant_Garamond',serif] font-bold text-[44px] md:text-[52px] text-[#171717] leading-[1.05] mb-2">{product.name}</h1>
            <p className="font-['IBM_Plex_Sans',sans-serif] font-light text-[14px] text-[rgba(23,23,23,0.55)] mb-4">{cleanNotes(product.notes)}</p>

            {/* Stars */}
            <div className="flex items-center gap-1 mb-5">
              {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#AE9766" stroke="none" />)}
              <span className="font-['IBM_Plex_Sans',sans-serif] text-[12px] text-[rgba(23,23,23,0.4)] ml-2">(89 reviews)</span>
            </div>

            <p className="font-['IBM_Plex_Sans',sans-serif] font-light text-[14px] text-[rgba(23,23,23,0.72)] leading-[1.8] mb-7">{product.description}</p>

            {/* Size selector */}
            <p className="font-['Cormorant_Garamond',serif] font-semibold text-[17px] text-[#171717] mb-3">Select Size</p>
            <div className="flex gap-3 mb-4">
              {product.sizes.map((size) => (
                <button key={size.label} onClick={() => setSelectedSize(size)}
                  className={`flex-1 py-3 rounded-lg border transition-all ${selectedSize.label === size.label ? "bg-[#171717] text-white border-[#171717]" : "bg-white text-[#171717] border-[rgba(0,0,0,0.15)] hover:border-[#171717]"}`}>
                  <p className="font-['IBM_Plex_Sans',sans-serif] text-[13px] font-medium">{size.label}</p>
                  <p className={`text-[11px] mt-0.5 ${selectedSize.label === size.label ? "text-white/70" : "text-[rgba(23,23,23,0.5)]"}`}>PHP {size.price}</p>
                </button>
              ))}
            </div>

            {/* Qty */}
            <div className="flex items-center gap-4 mb-6">
              <p className="font-['Cormorant_Garamond',serif] font-semibold text-[17px] text-[#171717]">Qty</p>
              <div className="flex items-center border border-[rgba(0,0,0,0.18)] rounded-lg overflow-hidden">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-[#f0ece4] transition-colors"><Minus size={13} /></button>
                <span className="px-4 font-['IBM_Plex_Sans',sans-serif] text-[14px] font-medium">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="px-3 py-2 hover:bg-[#f0ece4] transition-colors"><Plus size={13} /></button>
              </div>
              <p className="font-['IBM_Plex_Sans',sans-serif] font-semibold text-[22px] text-[#171717] ml-auto">PHP {selectedSize.price * qty}</p>
            </div>

            {/* CTA buttons */}
            <div className="flex gap-3 mb-8">
              <DarkBtn onClick={handleAdd} className="flex-1 py-4 flex items-center justify-center gap-2 text-center">
                {added ? <><Check size={15} /> ADDED TO CART</> : "ADD TO CART"}
              </DarkBtn>
              <button onClick={() => { addToCart(product, selectedSize.label, selectedSize.price); navigate("checkout"); }}
                className="flex-1 py-4 border border-[#171717] font-['Cormorant_Garamond',serif] font-bold text-[15px] tracking-[0.12em] rounded-[5px] hover:bg-[#171717] hover:text-white transition-all">
                BUY NOW
              </button>
            </div>

            {/* Trust bar */}
            <div className="border-t border-[rgba(0,0,0,0.08)] pt-5 grid grid-cols-3 gap-3">
              {[{ Icon: Shield, label: "Authentic" }, { Icon: Package, label: "Secure Pack" }, { Icon: Truck, label: "Fast Delivery" }].map(({ Icon, label }, i) => (
                <div key={i} className="flex items-center gap-2 text-[rgba(23,23,23,0.5)]">
                  <Icon size={15} strokeWidth={1.5} />
                  <span className="font-['IBM_Plex_Sans',sans-serif] font-light text-[12px]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="font-['Cormorant_Garamond',serif] font-bold text-[34px] text-[#171717] tracking-wide mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((p) => <ProductCard key={p.id} product={p} navigate={navigate} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ CART PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CartPage({ items, navigate, updateQty, removeItem }: {
  items: CartItem[];
  navigate: (p: Page) => void;
  updateQty: (id: number, size: string, qty: number) => void;
  removeItem: (id: number, size: string) => void;
}) {
  const subtotal = items.reduce((acc, i) => acc + i.price * i.qty, 0);

  return (
    <div className="bg-[#f7f5f1] min-h-screen">
      <div className="max-w-[1100px] mx-auto px-6 py-12">
        <div className="flex items-start gap-4 mb-10">
          <div>
            <GoldBar />
            <h1 className="font-['Cormorant_Garamond',serif] font-bold text-[52px] text-[#171717] tracking-[0.04em] mt-4">YOUR CART</h1>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-28 flex flex-col items-center">
            <ShoppingCart size={56} strokeWidth={1} className="text-[rgba(23,23,23,0.2)] mb-6" />
            <p className="font-['Cormorant_Garamond',serif] text-[30px] text-[rgba(23,23,23,0.4)] mb-8">Your cart is empty.</p>
            <DarkBtn onClick={() => navigate("collections")}>START SHOPPING</DarkBtn>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Items */}
            <div className="flex-1 space-y-3">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.size}`}
                  className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-[0px_2px_12px_rgba(0,0,0,0.05)]">
                  <div className="bg-[#f5f2ed] rounded-xl w-[76px] h-[76px] flex items-center justify-center flex-shrink-0">
                    <img src={item.product.img} alt={item.product.name} className="h-16 object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-['IBM_Plex_Sans',sans-serif] text-[10px] tracking-[0.14em] text-[rgba(23,23,23,0.4)] uppercase">{item.product.brand}</p>
                    <p className="font-['Cormorant_Garamond',serif] font-semibold text-[19px] text-[#171717] truncate">{item.product.name}</p>
                    <p className="font-['IBM_Plex_Sans',sans-serif] text-[12px] text-[rgba(23,23,23,0.45)]">{item.size} • PHP {item.price} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.product.id, item.size, item.qty - 1)}
                      className="w-7 h-7 border border-[rgba(0,0,0,0.18)] rounded-full flex items-center justify-center hover:bg-[#171717] hover:text-white transition-colors">
                      <Minus size={11} />
                    </button>
                    <span className="font-['IBM_Plex_Sans',sans-serif] w-5 text-center text-[14px]">{item.qty}</span>
                    <button onClick={() => updateQty(item.product.id, item.size, item.qty + 1)}
                      className="w-7 h-7 border border-[rgba(0,0,0,0.18)] rounded-full flex items-center justify-center hover:bg-[#171717] hover:text-white transition-colors">
                      <Plus size={11} />
                    </button>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className="font-['IBM_Plex_Sans',sans-serif] font-semibold text-[16px] text-[#171717]">PHP {item.price * item.qty}</p>
                    <button onClick={() => removeItem(item.product.id, item.size)}
                      className="font-['IBM_Plex_Sans',sans-serif] text-[10px] text-[rgba(23,23,23,0.35)] hover:text-red-500 transition-colors mt-1">
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <button onClick={() => navigate("collections")}
                className="font-['IBM_Plex_Sans',sans-serif] font-light text-[13px] text-[rgba(23,23,23,0.5)] hover:text-[#171717] transition-colors flex items-center gap-1.5 mt-2">
                <ArrowLeft size={13} /> Continue Shopping
              </button>
            </div>

            {/* Summary */}
            <div className="md:w-[320px] flex-shrink-0">
              <div className="bg-white rounded-2xl p-7 shadow-[0px_2px_12px_rgba(0,0,0,0.05)] sticky top-24">
                <p className="font-['Cormorant_Garamond',serif] font-bold text-[24px] text-[#171717] mb-6">Order Summary</p>
                <div className="space-y-3 border-b border-[rgba(0,0,0,0.07)] pb-4 mb-4">
                  {items.map((item) => (
                    <div key={`${item.product.id}-${item.size}`} className="flex justify-between font-['IBM_Plex_Sans',sans-serif] text-[13px] text-[rgba(23,23,23,0.65)]">
                      <span className="truncate pr-2 max-w-[160px]">{item.product.name} ({item.size}) x{item.qty}</span>
                      <span className="flex-shrink-0">PHP {item.price * item.qty}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-['IBM_Plex_Sans',sans-serif] text-[13px] text-[rgba(23,23,23,0.65)] mb-2">
                  <span>Shipping</span><span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="border-t border-[rgba(0,0,0,0.07)] pt-4 mt-2 mb-6">
                  <div className="flex justify-between font-['Cormorant_Garamond',serif] font-bold text-[22px] text-[#171717]">
                    <span>Total</span><span>PHP {subtotal}</span>
                  </div>
                </div>
                <DarkBtn onClick={() => navigate("checkout")} className="w-full py-4 block text-center">PROCEED TO CHECKOUT</DarkBtn>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€â”€ CHECKOUT PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CheckoutPage({ items, navigate }: { items: CartItem[]; navigate: (p: Page) => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", city: "", zip: "", payment: "gcash" });
  const subtotal = items.reduce((acc, i) => acc + i.price * i.qty, 0);

  const F = ({ label, name, type = "text", placeholder, half = false }: {
    label: string; name: keyof typeof form; type?: string; placeholder?: string; half?: boolean;
  }) => (
    <div className={half ? "" : "md:col-span-2"}>
      <label className="font-['IBM_Plex_Sans',sans-serif] text-[10px] tracking-[0.16em] text-[rgba(23,23,23,0.5)] uppercase block mb-1.5">{label}</label>
      <input type={type} value={form[name]} placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="w-full border border-[rgba(0,0,0,0.14)] rounded-lg px-4 py-3 font-['IBM_Plex_Sans',sans-serif] text-[14px] bg-white focus:outline-none focus:border-[#171717] transition-colors" />
    </div>
  );

  const StepDot = ({ n }: { n: number }) => (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-['IBM_Plex_Sans',sans-serif] font-medium transition-all ${step > n ? "bg-[#AE9766] text-white" : step === n ? "bg-[#171717] text-white" : "bg-[rgba(0,0,0,0.1)] text-[rgba(23,23,23,0.4)]"}`}>
        {step > n ? <Check size={10} /> : n}
      </div>
      <span className={`font-['IBM_Plex_Sans',sans-serif] text-[12px] tracking-wide ${step === n ? "text-[#171717] font-medium" : "text-[rgba(23,23,23,0.35)]"}`}>
        {["Shipping", "Payment", "Review"][n - 1]}
      </span>
    </div>
  );

  return (
    <div className="bg-[#f7f5f1] min-h-screen">
      <div className="max-w-[1100px] mx-auto px-6 py-12">
        <GoldBar />
        <h1 className="font-['Cormorant_Garamond',serif] font-bold text-[52px] text-[#171717] tracking-[0.04em] mt-4 mb-6">CHECKOUT</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-10">
          <StepDot n={1} />
          <div className="w-8 h-px bg-[rgba(0,0,0,0.15)]" />
          <StepDot n={2} />
          <div className="w-8 h-px bg-[rgba(0,0,0,0.15)]" />
          <StepDot n={3} />
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Form area */}
          <div className="flex-1">
            {step === 1 && (
              <div className="bg-white rounded-2xl p-7 shadow-[0px_2px_12px_rgba(0,0,0,0.05)]">
                <p className="font-['Cormorant_Garamond',serif] font-bold text-[28px] text-[#171717] mb-6">Shipping Information</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <F label="Full Name" name="name" placeholder="Juan dela Cruz" half />
                  <F label="Email Address" name="email" type="email" placeholder="juan@email.com" half />
                  <F label="Phone Number" name="phone" placeholder="+63 9XX XXX XXXX" half />
                  <F label="City" name="city" placeholder="Manila" half />
                  <F label="Street Address" name="address" placeholder="123 Rizal St., Barangay..." />
                  <F label="ZIP Code" name="zip" placeholder="1000" half />
                </div>
                <DarkBtn onClick={() => setStep(2)} className="mt-7">CONTINUE TO PAYMENT</DarkBtn>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-2xl p-7 shadow-[0px_2px_12px_rgba(0,0,0,0.05)]">
                <p className="font-['Cormorant_Garamond',serif] font-bold text-[28px] text-[#171717] mb-6">Payment Method</p>
                <div className="space-y-3">
                  {[
                    { value: "gcash", label: "GCash", desc: "Pay via GCash e-wallet" },
                    { value: "cod", label: "Cash on Delivery", desc: "Pay when your order arrives" },
                    { value: "bank", label: "Bank Transfer", desc: "BDO • BPI • UnionBank" },
                  ].map((opt) => (
                    <label key={opt.value}
                      className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${form.payment === opt.value ? "border-[#171717] bg-[#f7f5f1]" : "border-[rgba(0,0,0,0.12)] hover:border-[rgba(0,0,0,0.28)]"}`}>
                      <input type="radio" name="payment" value={opt.value} checked={form.payment === opt.value}
                        onChange={(e) => setForm({ ...form, payment: e.target.value })} className="accent-[#171717]" />
                      <div>
                        <p className="font-['IBM_Plex_Sans',sans-serif] font-medium text-[15px] text-[#171717]">{opt.label}</p>
                        <p className="font-['IBM_Plex_Sans',sans-serif] font-light text-[12px] text-[rgba(23,23,23,0.45)]">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex items-center gap-5 mt-7">
                  <button onClick={() => setStep(1)} className="flex items-center gap-1.5 font-['IBM_Plex_Sans',sans-serif] text-[13px] text-[rgba(23,23,23,0.55)] hover:text-[#171717] transition-colors">
                    <ArrowLeft size={13} /> Back
                  </button>
                  <DarkBtn onClick={() => setStep(3)}>REVIEW ORDER</DarkBtn>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-2xl p-7 shadow-[0px_2px_12px_rgba(0,0,0,0.05)]">
                <p className="font-['Cormorant_Garamond',serif] font-bold text-[28px] text-[#171717] mb-6">Review Your Order</p>
                <div className="space-y-3 mb-5">
                  {items.map((item) => (
                    <div key={`${item.product.id}-${item.size}`} className="flex items-center gap-4 py-3 border-b border-[rgba(0,0,0,0.06)]">
                      <div className="bg-[#f5f2ed] rounded-xl w-14 h-14 flex items-center justify-center flex-shrink-0">
                        <img src={item.product.img} alt={item.product.name} className="h-12 object-contain" />
                      </div>
                      <div className="flex-1">
                        <p className="font-['Cormorant_Garamond',serif] font-semibold text-[17px] text-[#171717]">{item.product.name}</p>
                        <p className="font-['IBM_Plex_Sans',sans-serif] text-[12px] text-[rgba(23,23,23,0.45)]">{item.size} x {item.qty}</p>
                      </div>
                      <p className="font-['IBM_Plex_Sans',sans-serif] font-medium text-[15px]">PHP {item.price * item.qty}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-[#f7f5f1] rounded-xl p-4 mb-6 space-y-1.5">
                  <p className="font-['IBM_Plex_Sans',sans-serif] text-[13px] text-[rgba(23,23,23,0.55)]">
                    Ship to: <span className="text-[#171717]">{form.address || "-"}{form.city ? `, ${form.city}` : ""} {form.zip}</span>
                  </p>
                  <p className="font-['IBM_Plex_Sans',sans-serif] text-[13px] text-[rgba(23,23,23,0.55)]">
                    Payment: <span className="text-[#171717] capitalize">{form.payment === "cod" ? "Cash on Delivery" : form.payment === "gcash" ? "GCash" : "Bank Transfer"}</span>
                  </p>
                </div>
                <div className="flex items-center gap-5">
                  <button onClick={() => setStep(2)} className="flex items-center gap-1.5 font-['IBM_Plex_Sans',sans-serif] text-[13px] text-[rgba(23,23,23,0.55)] hover:text-[#171717] transition-colors">
                    <ArrowLeft size={13} /> Back
                  </button>
                  <DarkBtn onClick={() => navigate("confirmation")}>PLACE ORDER</DarkBtn>
                </div>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="md:w-[300px] flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-[0px_2px_12px_rgba(0,0,0,0.05)] sticky top-24">
              <p className="font-['Cormorant_Garamond',serif] font-bold text-[22px] text-[#171717] mb-5">Order Summary</p>
              <div className="space-y-2 border-b border-[rgba(0,0,0,0.07)] pb-4 mb-3">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.size}`} className="flex justify-between font-['IBM_Plex_Sans',sans-serif] text-[12px] text-[rgba(23,23,23,0.65)]">
                    <span className="truncate pr-2 max-w-[160px]">{item.product.name} ({item.size}) x{item.qty}</span>
                    <span>PHP {item.price * item.qty}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-['IBM_Plex_Sans',sans-serif] text-[12px] text-[rgba(23,23,23,0.55)] mb-1">
                <span>Shipping</span><span className="text-green-600">Free</span>
              </div>
              <div className="border-t border-[rgba(0,0,0,0.07)] pt-3 mt-2">
                <div className="flex justify-between font-['Cormorant_Garamond',serif] font-bold text-[20px] text-[#171717]">
                  <span>Total</span><span>PHP {subtotal}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ CONFIRMATION PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ConfirmationPage({ navigate }: { navigate: (p: Page) => void }) {
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
                    <span className="mt-2 h-3 w-3 rounded-full border border-[#AE9766] bg-[#fbf8f1] transition-transform duration-500 group-hover:scale-[1.8]" />
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
  const [page, setPage] = useState<Page>("home");
  const [selectedProduct, setSelectedProduct] = useState<Product>(ALL_PRODUCTS[0]);
  const [collectionFilters, setCollectionFilters] = useState<Partial<Filters>>({});
  const [cart, setCart] = useState<CartItem[]>([]);

  const navigate = (p: Page, data?: unknown) => {
    if (p === "product" && data) setSelectedProduct(data as Product);
    if (p === "collections" && data && typeof data === "object") {
      setCollectionFilters(data as Partial<Filters>);
    } else if (p === "collections") {
      setCollectionFilters({});
    }
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addToCart = (product: Product, size: string, price: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && i.size === size);
      if (existing) return prev.map((i) => i.product.id === product.id && i.size === size ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, size, price, qty: 1 }];
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
      case "collections": return <CollectionsPage navigate={navigate} initialFilters={collectionFilters} />;
      case "bestsellers": return <BestSellersPage navigate={navigate} />;
      case "discovery":   return <DiscoveryPage navigate={navigate} />;
      case "decantguide": return <DecantGuidePage />;
      case "faq":         return <FAQPage />;
      case "product":     return <ProductPage product={selectedProduct} navigate={navigate} addToCart={addToCart} />;
      case "cart":        return <CartPage items={cart} navigate={navigate} updateQty={updateQty} removeItem={removeItem} />;
      case "checkout":    return <CheckoutPage items={cart} navigate={navigate} />;
      case "confirmation":return <ConfirmationPage navigate={navigate} />;
      default:            return <HomePage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f5f1]">
      {page !== "confirmation" && (
        <Header page={page} navigate={navigate} cartCount={cartCount} />
      )}
      <main className="flex-1">{renderPage()}</main>
      {page !== "checkout" && page !== "confirmation" && (
        <Footer navigate={navigate} />
      )}
    </div>
  );
}
