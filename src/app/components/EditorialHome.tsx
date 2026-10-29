import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Compass, Leaf, Package, Pause, Play, ShieldCheck, Truck } from "lucide-react";
import { ShopProductCard, type StoreProduct } from "./StorefrontInterfaces";

type DiscoverySet = { id: number; name: string; subtitle: string; count: number; price: number; tags: string[]; productIds: number[] };
type HomeProps = {
  products: StoreProduct[]; sets: DiscoverySet[];
  images: { hero: string; fresh: string; timber: string; vanilla: string; night: string; discovery: string; bottle: string };
  onCollections: (category?: string) => void; onProduct: (product: StoreProduct) => void;
  onSet: (id: number) => void; onPage: (page: "bestsellers" | "scentfinder" | "decantguide") => void;
};
const ease = [.19, 1, .22, 1] as const;
const price = (value: number) => `PHP ${value.toLocaleString("en-PH")}`;

function Enter({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .12 }} transition={{ duration: .85, ease, delay: reduced ? 0 : delay }}>{children}</motion.div>;
}

function SectionTitle({ eyebrow, title, children, action, onAction }: { eyebrow: string; title: ReactNode; children?: ReactNode; action?: string; onAction?: () => void }) {
  return <Enter className="maison-section-heading"><div><p className="maison-eyebrow">{eyebrow}</p><h2>{title}</h2>{children && <p className="maison-section-description">{children}</p>}</div>{action && <button className="maison-link" onClick={onAction}>{action}<ArrowUpRight size={16} strokeWidth={1.3} /></button>}</Enter>;
}

export function EditorialHome({ products, sets, images, onCollections, onProduct, onSet, onPage }: HomeProps) {
  const reduced = useReducedMotion();
  const hero = useRef<HTMLElement>(null);
  const discovery = useRef<HTMLElement>(null);
  const discoveryVisible = useInView(discovery, { amount: .25 });
  const { scrollYProgress } = useScroll({ target: hero, offset: ["start start", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 30]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(true);
  const [direction, setDirection] = useState(1);
  const current = sets[active];
  const activeProducts = products.filter(p => current.productIds.includes(p.id));
  const autoplay = !reduced && !paused && !interacting && discoveryVisible && documentVisible;
  useEffect(() => {
    const update = () => setDocumentVisible(!document.hidden);
    update(); document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setInterval(() => { setDirection(1); setActive(index => (index + 1) % sets.length); }, 6500);
    return () => clearInterval(timer);
  }, [autoplay, active, sets.length]);
  const select = (index: number) => { setDirection(index >= active ? 1 : -1); setActive((index + sets.length) % sets.length); };
  const collections = [
    { name: "Fresh perspectives", category: "FRESH", note: "Crisp, bright & effortlessly you.", image: images.fresh, tone: "fresh" },
    { name: "Timber & smoke", category: "TIMBER & SMOKE", note: "Grounded in something deeper.", image: images.timber, tone: "timber" },
    { name: "Golden vanilla", category: "GOLDEN VANILLA", note: "A little warmth, a lasting impression.", image: images.vanilla, tone: "vanilla" },
    { name: "After hours", category: "AFTER HOURS", note: "For the moments that linger.", image: images.night, tone: "night" },
  ];
  return <div className="maison-home">
    <section className="maison-hero" ref={hero} aria-labelledby="maison-hero-title">
      <div className="maison-hero-art"><motion.img src={images.hero} alt="Glass fragrance decants resting on cream silk" loading="eager" style={reduced ? undefined : { y: photoY }} initial={reduced ? false : { scale: 1.045 }} animate={{ scale: 1 }} transition={{ duration: 1.8, ease }} /><div className="maison-hero-wash" /></div>
      <motion.div className="maison-wrap maison-hero-layout" style={reduced ? undefined : { y: copyY }}>
        <div className="maison-hero-copy">
          <motion.p className="maison-eyebrow" initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, ease, delay: .1 }}>FRAGRANCE, MORE FREELY</motion.p>
          <h1 id="maison-hero-title">{["Your signature", "scent, decanted."].map((line, i) => <span className="maison-title-mask" key={line}><motion.span initial={reduced ? false : { y: "105%", rotate: 1.5 }} animate={{ y: "0%", rotate: 0 }} transition={{ duration: 1.1, delay: .18 + i * .13, ease }}>{line}</motion.span></span>)}</h1>
          <motion.div initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .9, delay: .5, ease }}><p className="maison-hero-description">Discover iconic and niche fragrances in perfectly portioned decants. Luxury scents, without the commitment.</p><div className="maison-hero-actions"><button className="maison-button" onClick={() => onCollections()}>Shop decants <ArrowRight size={18} strokeWidth={1.3} /></button><button className="maison-link" onClick={() => onPage("scentfinder")}>Find my scent <ArrowUpRight size={16} /></button></div></motion.div>
        </div>
        <motion.div className="maison-hero-footnote" initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 1 }}><span>SMALLER BOTTLES.</span><p>Bigger possibilities.</p><i /></motion.div>
      </motion.div>
      <a className="maison-scroll-cue" href="#maison-collections"><span>THE ART OF DISCOVERY</span><i /></a>
    </section>

    <motion.section id="maison-collections" className="maison-collections" initial={reduced ? false : { y: 36 }} whileInView={{ y: 0 }} viewport={{ once: true, amount: .02 }} transition={{ duration: 1, ease }} aria-labelledby="maison-collections-title">
      <div className="maison-wrap">
        <SectionTitle eyebrow="01 / FOLLOW A FEELING" title={<span id="maison-collections-title">A scent for every side of you.</span>} action="Explore all" onAction={() => onCollections()} />
        <div className="maison-collection-grid">{collections.map((collection, index) => <Enter key={collection.category} delay={index * .07}><button className={`maison-collection maison-collection--${collection.tone}`} onClick={() => onCollections(collection.category)}>
          <img className="maison-collection-texture" src={collection.image} alt="" loading="lazy" /><div className="maison-collection-shade" /><img className="maison-collection-bottle" src={images.bottle} alt="" loading="lazy" /><span className="maison-collection-index">0{index + 1}</span><div className="maison-collection-copy"><h3>{collection.name}</h3><p>{collection.note}</p><span className="maison-collection-arrow"><ArrowRight size={17} strokeWidth={1.2} /></span></div>
        </button></Enter>)}</div>
      </div>
    </motion.section>

    <section className="maison-edit" aria-labelledby="maison-edit-title"><div className="maison-wrap"><SectionTitle eyebrow="02 / THE CONSIDERED EDIT" title={<span id="maison-edit-title">Worth getting to know.</span>} action="All bestsellers" onAction={() => onPage("bestsellers")}>A few favourites. A beautiful place to begin.</SectionTitle><div className="maison-product-grid">{products.filter(p => p.bestSeller).slice(0, 4).map((product, i) => <Enter key={product.id} delay={i * .075}><ShopProductCard product={product} onOpen={() => onProduct(product)} /></Enter>)}</div></div></section>

    <section className="maison-story" aria-labelledby="maison-story-title"><div className="maison-wrap maison-story-layout"><Enter className="maison-story-art"><div className="maison-story-photo"><img src={images.hero} alt="Fragrance decants arranged on softly folded silk" loading="lazy" /></div><div className="maison-story-caption"><span>THE JOSHUA APPROACH</span><p>Less commitment.<br /><em>More discovery.</em></p><i /></div><span className="maison-story-folio">A LITTLE, BEAUTIFULLY CHOSEN.</span></Enter><Enter className="maison-story-copy" delay={.1}><p className="maison-eyebrow">03 / ABOUT DECANTS BY JOSHUA</p><h2 id="maison-story-title">Fragrance is personal.<br />Finding it should<br />feel that way, too.</h2><p className="maison-story-lead">The first impression is only the beginning.</p><p>At Decants by Joshua, discovery comes in smaller portions. Wear a fragrance on your skin, let it settle into your day, and take your time finding what feels like you.</p><p>From a familiar favourite to an unexpected new note, a decant makes room for a more personal fragrance wardrobe.</p><button className="maison-link" onClick={() => onPage("decantguide")}>Discover the decant ritual <ArrowUpRight size={17} /></button></Enter></div></section>

    <section className="maison-service" aria-label="The details that matter"><div className="maison-wrap maison-service-grid">{[{ Icon: ShieldCheck, title: "Authentic fragrances", copy: "The scents you came to discover." }, { Icon: Package, title: "Considered portions", copy: "Explore in 2ml, 5ml and 10ml." }, { Icon: Truck, title: "Delivery with care", copy: "From our collection to your door." }].map(({ Icon, title, copy }, i) => <Enter key={title} delay={i * .06}><Icon size={27} strokeWidth={1.1} /><div><h3>{title}</h3><p>{copy}</p></div></Enter>)}</div></section>

    <section className="maison-discovery" ref={discovery} aria-labelledby="maison-discovery-title"><div className="maison-wrap"><SectionTitle eyebrow="04 / A WARDROBE OF POSSIBILITIES" title={<span id="maison-discovery-title">One box. Many first impressions.</span>} action="Find my scent" onAction={() => onPage("scentfinder")} />
      <Enter><div className="maison-discovery-panel" onPointerEnter={() => setInteracting(true)} onPointerLeave={() => setInteracting(false)} onFocusCapture={() => setInteracting(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}>
        <div className="maison-discovery-stage"><img className="maison-discovery-bg" src={images.discovery} alt="" loading="lazy" /><span className="maison-discovery-art-label">THE DISCOVERY COLLECTION</span><AnimatePresence mode="wait"><motion.div key={current.id} className="maison-discovery-bottles" initial={reduced ? false : { opacity: 0, x: direction * 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduced ? 0 : -direction * 20 }} transition={{ duration: reduced ? 0 : .5, ease }}>{activeProducts.slice(0, 3).map((p, i) => <img key={p.id} src={p.img} alt={`${p.name} decant in ${current.name}`} className={`maison-set-bottle maison-set-bottle--${i}`} />)}</motion.div></AnimatePresence><div className="maison-discovery-plinth" /><span className="maison-discovery-stage-caption">A CURATED SELECTION, READY TO EXPLORE.</span></div>
        <div className="maison-discovery-info"><div className="maison-set-meta"><span>DISCOVERY SET {String(active + 1).padStart(2, "0")}</span><span>{current.count} FRAGRANCES</span></div><AnimatePresence mode="wait"><motion.div className="maison-set-copy" key={current.id} initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -10 }} transition={{ duration: reduced ? 0 : .3, ease }}><h3>{current.name}</h3><p>{current.subtitle}</p><div className="maison-set-tags">{current.tags.map(tag => <span key={tag}>{tag}</span>)}</div><div className="maison-set-price"><strong>{price(current.price)}</strong><span>THE COMPLETE SET</span></div><button className="maison-button" onClick={() => onSet(current.id)}>Explore this set <ArrowRight size={17} /></button></motion.div></AnimatePresence>
        <div className="maison-set-navigation"><div className="maison-set-dots" role="group" aria-label="Choose a discovery set">{sets.map((set, index) => <button key={set.id} aria-label={`Show ${set.name}`} aria-pressed={active === index} onClick={() => select(index)}><span /></button>)}</div><div className="maison-set-arrows"><button aria-label="Previous discovery set" onClick={() => select(active - 1)}><ChevronLeft size={18} /></button><button aria-label={paused ? "Play discovery carousel" : "Pause discovery carousel"} onClick={() => setPaused(value => !value)}>{paused ? <Play size={13} /> : <Pause size={13} />}</button><button aria-label="Next discovery set" onClick={() => select(active + 1)}><ChevronRight size={18} /></button></div></div>
        </div>
      </div></Enter>
    </div></section>

    <section className="maison-journal" aria-labelledby="maison-journal-title"><div className="maison-wrap"><Enter className="maison-journal-layout"><div className="maison-journal-mark"><Leaf size={46} strokeWidth={.8} /><span>THE SCENT NOTES</span></div><div className="maison-journal-copy"><p className="maison-eyebrow">THE ART OF WEARING FRAGRANCE</p><h2 id="maison-journal-title">A little knowledge.<br /><em>A more beautiful ritual.</em></h2></div><div className="maison-journal-action"><p>How to choose, wear and care for the scents that become part of your everyday.</p><button className="maison-link" onClick={() => onPage("decantguide")}>Read the decant guide <ArrowUpRight size={17} /></button></div></Enter></div></section>
    <div className="maison-closing"><Compass size={15} strokeWidth={1} /><span>YOUR NEXT CHAPTER BEGINS WITH A SCENT.</span></div>
  </div>;
}
