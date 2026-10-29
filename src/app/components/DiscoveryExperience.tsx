import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Compass, Layers, Leaf, Package, Sparkles } from "lucide-react";
import { ShopProductCard, type StoreProduct } from "./StorefrontInterfaces";

export interface DiscoveryEdit {
  id: number; name: string; subtitle: string; count: number; price: number; tags: string[]; productIds: number[];
}
type DiscoveryImages = { silk: string; texture: string };
type Props = {
  sets: DiscoveryEdit[]; products: StoreProduct[]; images: DiscoveryImages;
  onSet: (id: number) => void; onProduct: (product: StoreProduct) => void; onFinder: () => void;
};
const ease = [.19, 1, .22, 1] as const;
const money = (value: number) => `PHP ${value.toLocaleString("en-PH")}`;
const notes = (value: string) => value.replaceAll("â€¢", "·").replaceAll("•", "·");
const getLineup = (set: DiscoveryEdit, products: StoreProduct[]) => set.productIds.map(id => products.find(p => p.id === id)).filter((p): p is StoreProduct => Boolean(p));

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .08 }} transition={{ duration: .8, ease, delay: reduced ? 0 : delay }}>{children}</motion.div>;
}

function SetStage({ set, products, images, compact = false, onProduct }: { set: DiscoveryEdit; products: StoreProduct[]; images: DiscoveryImages; compact?: boolean; onProduct?: Props["onProduct"] }) {
  const lineup = getLineup(set, products);
  return <div className={`ds-stage ds-stage--${set.id} ${compact ? "ds-stage--compact" : ""}`}>
    <img className="ds-stage-texture" src={images.texture} alt="" loading="lazy" />
    <div className="ds-stage-light" /><span className="ds-stage-folio">THE DISCOVERY EDIT / {String(set.id).padStart(2, "0")}</span>
    <div className="ds-stage-platform" />
    <div className="ds-bottle-row" style={{ "--ds-count": lineup.length } as React.CSSProperties}>
      {lineup.map((product, i) => <div className={`ds-bottle ds-bottle--${i}`} key={product.id} style={{ "--ds-index": i, "--ds-lean": `${(i - (lineup.length - 1) / 2) * 3}deg` } as React.CSSProperties}>
        {onProduct ? <button onClick={() => onProduct(product)} aria-label={`Explore ${product.name}`}><img src={product.img} alt={`${product.name} decant`} loading="lazy" /></button> : <img src={product.img} alt={`${product.name} decant`} loading="lazy" />}
      </div>)}
    </div>
    <span className="ds-stage-caption">{lineup.length} FRAGRANCES. ROOM FOR SOMETHING NEW.</span>
  </div>;
}

function Tags({ set }: { set: DiscoveryEdit }) {
  return <div className="ds-tags">{set.tags.map(tag => <span key={tag}>{tag}</span>)}</div>;
}

function SetCard({ set, products, images, onSet, onProduct }: Pick<Props, "products" | "images" | "onSet" | "onProduct"> & { set: DiscoveryEdit }) {
  return <article className="ds-set-card">
    <button className="ds-set-card-art" aria-label={`View ${set.name}`} onClick={() => onSet(set.id)}><SetStage set={set} products={products} images={images} compact /><span className="ds-card-explore-icon"><ArrowUpRight size={20} strokeWidth={1.2} /></span></button>
    <div className="ds-set-card-content"><div className="ds-card-meta"><span>EDIT {String(set.id).padStart(2, "0")}</span><span>{set.count} FRAGRANCES</span></div><div className="ds-card-title"><h3><button onClick={() => onSet(set.id)}>{set.name}</button></h3><strong>{money(set.price)}</strong></div><p>{set.subtitle}</p><Tags set={set} />
      <details className="ds-lineup-disclosure"><summary>Inside the edit <span>{set.count} scents</span><ChevronDown size={15} /></summary><div>{getLineup(set, products).map((product, index) => <button key={product.id} onClick={() => onProduct(product)}><span>{String(index + 1).padStart(2, "0")}</span><span>{product.name}<small>{notes(product.notes)}</small></span><ArrowUpRight size={14} /></button>)}</div></details>
      <button className="ds-text-link" onClick={() => onSet(set.id)}>Discover this set <ArrowRight size={16} /></button>
    </div>
  </article>;
}

const moods = [
  { label: "All discoveries", tags: [] as string[] },
  { label: "Fresh & bright", tags: ["Fresh", "Citrus"] },
  { label: "Warm & woody", tags: ["Woody", "Oud"] },
  { label: "Unexpected notes", tags: ["Chypre", "Oriental"] },
];

export function DiscoveryCollection({ sets, products, images, onSet, onProduct, onFinder, selectedSetId }: Props & { selectedSetId?: number | null }) {
  const reduced = useReducedMotion();
  const [activeId, setActiveId] = useState(selectedSetId ?? sets[0].id);
  const [mood, setMood] = useState(0);
  useEffect(() => { if (selectedSetId && sets.some(set => set.id === selectedSetId)) setActiveId(selectedSetId); }, [selectedSetId, sets]);
  const active = sets.find(set => set.id === activeId) ?? sets[0];
  const visible = sets.filter(set => !moods[mood].tags.length || set.tags.some(tag => moods[mood].tags.includes(tag)));
  return <div className="discovery-experience">
    <section className="ds-hero" aria-labelledby="ds-title"><div className="ds-shell ds-hero-grid"><Reveal className="ds-hero-copy"><p className="ds-eyebrow">THE ART OF EXPLORATION</p><h1 id="ds-title">Discovery sets.<br /><em>More than a<br />first impression.</em></h1><p className="ds-lead">A considered collection of scents, made for the beautifully undecided.</p><p>Meet a few new favourites. Live with them, discover their different sides, and find the ones that feel like you.</p><div className="ds-hero-actions"><a className="ds-button" href="#discovery-edits">Explore the sets <ArrowRight size={17} /></a><button className="ds-text-link" onClick={onFinder}>Help me choose <ArrowUpRight size={15} /></button></div><div className="ds-hero-note"><Layers size={18} strokeWidth={1.1} /><span>Four curated edits. Your own way to discover.</span></div></Reveal>
      <Reveal className="ds-feature" delay={.1}><AnimatePresence mode="wait"><motion.div className="ds-feature-image" key={active.id} initial={reduced ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduced ? 0 : -12 }} transition={{ duration: reduced ? 0 : .35, ease }}><SetStage set={active} products={products} images={images} /></motion.div></AnimatePresence><div className="ds-feature-label"><div><span>IN FOCUS</span><h2>{active.name}</h2></div><button onClick={() => onSet(active.id)} aria-label={`Explore ${active.name}`}><ArrowUpRight size={22} strokeWidth={1.1} /></button></div><div className="ds-feature-selector" role="group" aria-label="Preview a discovery set">{sets.map(set => <button key={set.id} aria-label={`Preview ${set.name}`} aria-pressed={active.id === set.id} onClick={() => setActiveId(set.id)}><span>{String(set.id).padStart(2, "0")}</span><i /></button>)}</div></Reveal>
    </div></section>

    <section className="ds-ritual-strip" aria-label="Your discovery ritual"><div className="ds-shell">{[{ number: "01", title: "Choose a feeling", copy: "Start with the notes that draw you in." }, { number: "02", title: "Take your time", copy: "Let each fragrance find its rhythm on skin." }, { number: "03", title: "Find your favourite", copy: "Build a wardrobe that feels entirely yours." }].map(item => <Reveal key={item.number}><span>{item.number}</span><div><h3>{item.title}</h3><p>{item.copy}</p></div></Reveal>)}</div></section>

    <section className="ds-edits" id="discovery-edits" aria-labelledby="ds-edits-title"><div className="ds-shell"><Reveal className="ds-section-heading"><div><p className="ds-eyebrow">THE CURATED COLLECTION</p><h2 id="ds-edits-title">Find your kind of discovery.</h2></div><p>Each edit is a different beginning.</p></Reveal><div className="ds-filter-bar"><div role="group" aria-label="Filter discovery sets by mood">{moods.map((option, index) => <button aria-pressed={index === mood} key={option.label} onClick={() => setMood(index)}>{option.label}</button>)}</div><span role="status" aria-live="polite">{visible.length} {visible.length === 1 ? "edit" : "edits"}</span></div><div className="ds-set-grid">{visible.map((set, index) => <Reveal key={set.id} delay={index * .06}><SetCard set={set} products={products} images={images} onSet={onSet} onProduct={onProduct} /></Reveal>)}</div></div></section>

    <section className="ds-finder" aria-labelledby="ds-finder-title"><div className="ds-shell"><Reveal className="ds-finder-panel"><div className="ds-finder-art"><img src={images.silk} alt="Fragrance decants on cream silk" loading="lazy" /></div><div className="ds-finder-copy"><Compass size={28} strokeWidth={1} /><p className="ds-eyebrow">FOLLOW YOUR CURIOSITY</p><h2 id="ds-finder-title">Not sure where<br /><em>to begin?</em></h2><p>Tell us a little about the scents you love. Find a new direction for your next discovery.</p><button className="ds-button" onClick={onFinder}>Find your scent <ArrowRight size={17} /></button></div></Reveal></div></section>
  </div>;
}

export function DiscoveryDetail({ sets, products, images, onSet, onProduct, onFinder, setId, onBack }: Props & { setId: number | null; onBack: () => void }) {
  const set = sets.find(item => item.id === setId) ?? sets[0];
  const lineup = getLineup(set, products);
  const others = sets.filter(item => item.id !== set.id).slice(0, 2);
  return <div className="discovery-experience ds-detail"><div className="ds-shell"><button className="ds-back" onClick={onBack}><ArrowLeft size={14} /> All discovery sets</button>
    <section className="ds-detail-panel" aria-labelledby="ds-detail-title"><Reveal className="ds-detail-gallery"><SetStage set={set} products={products} images={images} onProduct={onProduct} /><div className="ds-detail-image-note"><Sparkles size={15} strokeWidth={1.2} /><span>{set.count} different signatures, one place to start.</span></div></Reveal><Reveal className="ds-detail-info" delay={.08}><p className="ds-eyebrow">THE DISCOVERY COLLECTION / {String(set.id).padStart(2, "0")}</p><h1 id="ds-detail-title">{set.name}</h1><p className="ds-lead">{set.subtitle}</p><Tags set={set} /><dl className="ds-detail-stats"><div><dt>THE EDIT</dt><dd>{set.count} fragrances</dd></div><div><dt>SET PRICE</dt><dd>{money(set.price)}</dd></div></dl><a className="ds-button" href="#discovery-lineup">Explore the fragrances <ArrowRight size={17} /></a><p className="ds-detail-shopping-note">Choose and shop individual decant sizes from the lineup below. Your bag total reflects the decants you select.</p><div className="ds-detail-accordions"><details open><summary><Leaf size={17} /> The scent direction <ChevronDown size={15} /></summary><p>A journey through {set.tags.join(", ").toLowerCase()} notes. Try each fragrance on its own and give it time to develop before finding your favourite.</p></details><details><summary><Package size={17} /> What's inside the edit <ChevronDown size={15} /></summary><ol>{lineup.map(product => <li key={product.id}><button onClick={() => onProduct(product)}>{product.name}<ArrowUpRight size={13} /></button></li>)}</ol></details><details><summary><Compass size={17} /> Your discovery ritual <ChevronDown size={15} /></summary><p>Begin with one scent, notice its first impression, then revisit it as the day unfolds. Keep a note of what you love before trying the next.</p></details></div></Reveal></section>

    <section className="ds-detail-lineup" id="discovery-lineup" aria-labelledby="ds-lineup-title"><Reveal className="ds-section-heading"><div><p className="ds-eyebrow">GET TO KNOW EACH SCENT</p><h2 id="ds-lineup-title">Inside this edit.</h2></div><p>Choose your size. Make it personal.</p></Reveal><div className="ds-product-grid">{lineup.map((product, i) => <Reveal key={product.id} delay={i * .05}><ShopProductCard product={product} onOpen={() => onProduct(product)} /></Reveal>)}</div></section>

    <section className="ds-next-edits" aria-labelledby="ds-next-title"><Reveal className="ds-section-heading"><div><p className="ds-eyebrow">THERE'S MORE TO DISCOVER</p><h2 id="ds-next-title">Another side of you.</h2></div><button className="ds-text-link" onClick={onBack}>All discovery sets <ArrowUpRight size={15} /></button></Reveal><div className="ds-set-grid">{others.map((other, i) => <Reveal key={other.id} delay={i * .08}><SetCard set={other} products={products} images={images} onSet={onSet} onProduct={onProduct} /></Reveal>)}</div></section>
    <div className="ds-detail-assistance"><Check size={16} /><p>Prefer a little guidance?</p><button className="ds-text-link" onClick={onFinder}>Find your scent <ArrowUpRight size={14} /></button></div>
  </div></div>;
}
