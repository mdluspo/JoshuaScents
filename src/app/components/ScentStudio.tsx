import { useContext, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Plus, RotateCcw, X } from "lucide-react";
import { EMPTY_SCENT, preferencesFromPrompt, recommendScents, type ScentMatch, type ScentPreferences } from "../../lib/scent-matching";
import { FavoriteButton } from "./FavoriteButton";
import { StoreActions, type StoreProduct } from "./StorefrontInterfaces";

const price = (value: number) => `PHP ${value.toLocaleString("en-PH")}`;
const ease = [.22, .7, .25, 1] as const;
const startingPoints = [
  { label: "Fresh, never sweet", prompt: "Something clean and woody for everyday wear in humid weather, but not sweet." },
  { label: "An evening in", prompt: "A warm amber or vanilla fragrance for a quiet evening." },
  { label: "Softly floral", prompt: "I’m drawn to powdery iris, lavender and woods." },
];

function ScentSuggestion({ product, match, onProduct, index }: { product: StoreProduct; match: ScentMatch; onProduct: (product: StoreProduct) => void; index: number }) {
  const actions = useContext(StoreActions);
  const reduced = useReducedMotion();
  const [size, setSize] = useState(product.sizes[0]);
  const [added, setAdded] = useState(false);
  useEffect(() => { if (!added) return; const timer = window.setTimeout(() => setAdded(false), 2000); return () => clearTimeout(timer); }, [added]);
  return <motion.article className="scent-suggestion" initial={reduced ? false : { opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, delay: reduced ? 0 : index * .12, ease }}>
    <div className="scent-suggestion-art"><button onClick={() => onProduct(product)} aria-label={`Explore ${product.name}`}><img src={product.img} alt={`${product.name} fragrance decant`} /></button><FavoriteButton productId={product.id} className="scent-save" /></div>
    <div className="scent-suggestion-copy"><span className="scent-small-label">{index === 0 ? "A PLACE TO BEGIN" : "ANOTHER DIRECTION"} · {product.family}</span><button className="scent-suggestion-title" onClick={() => onProduct(product)}>{product.name}</button><p className="scent-listed-notes">{product.notes}</p><p className="scent-reason">{match.reason}</p><button className="scent-explore" onClick={() => onProduct(product)}>Get to know this scent<ArrowUpRight size={14} /></button></div>
    <div className="scent-suggestion-purchase"><label>Decant size<select aria-label={`Decant size for ${product.name}`} value={size.label} onChange={event => setSize(product.sizes.find(option => option.label === event.target.value)!)}>{product.sizes.map(option => <option key={option.label}>{option.label}</option>)}</select></label><strong>{price(size.price)}</strong><button className="scent-add" disabled={!actions} onClick={() => { actions?.add(product, size.label, size.price, 1); setAdded(true); }}>{added ? <Check size={14} /> : <Plus size={14} />}<span aria-live="polite">{added ? "Added to bag" : "Add to bag"}</span></button></div>
  </motion.article>;
}

export function ScentExperience({ products, onProduct, onCollections }: { products: StoreProduct[]; onProduct: (product: StoreProduct) => void; onCollections: () => void }) {
  const reduced = useReducedMotion();
  const [description, setDescription] = useState("");
  const [refinements, setRefinements] = useState<ScentPreferences>({ ...EMPTY_SCENT });
  const [submitted, setSubmitted] = useState<ScentPreferences | null>(null);
  const [revision, setRevision] = useState(0);
  const prompt = useRef<HTMLTextAreaElement>(null);
  const results = useRef<HTMLElement>(null);
  const timer = useRef<number | null>(null);
  const matches = useMemo(() => submitted ? recommendScents(products, submitted) : [], [products, submitted]);
  const dirty = submitted !== null && description.trim() !== submitted.description;
  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!description.trim()) return;
    setSubmitted(preferencesFromPrompt({ ...refinements, description: description.trim() }));
    setRevision(value => value + 1);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { results.current?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" }); results.current?.focus({ preventScroll: true }); }, reduced ? 0 : 160);
  }
  function reset() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    setDescription(""); setRefinements({ ...EMPTY_SCENT }); setSubmitted(null);
    window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
    prompt.current?.focus({ preventScroll: true });
  }
  return <div className={`scent-studio ${submitted ? "has-edit" : ""}`}>
    <div className="scent-studio-grain" aria-hidden="true" />
    <section className="scent-prompt-stage" aria-labelledby="scent-prompt-title"><div className="scent-studio-mark" aria-hidden="true"><span /><i /><span /></div><p className="scent-small-label">FIND YOUR SCENT</p><h1 id="scent-prompt-title">What would you like<br />to <em>smell like?</em></h1><p className="scent-prompt-subtitle">A mood. A memory. A note you can’t forget.</p>
      <form className="scent-composer" onSubmit={submit}><label htmlFor="scent-description" className="sr-only">Describe your ideal scent</label><textarea id="scent-description" ref={prompt} value={description} onChange={event => setDescription(event.target.value)} maxLength={600} rows={3} placeholder="Tell us what you’re drawn to… and what you’re not." required /><div className="scent-composer-bottom"><span>Make it as personal as you like.</span><button type="submit" disabled={!description.trim()}>{submitted ? "Reimagine my edit" : "Find my scent"}<ArrowRight size={17} strokeWidth={1.3} /></button></div></form>
      {!submitted ? <div className="scent-starting-points"><span>A little inspiration</span>{startingPoints.map(point => <button type="button" key={point.label} onClick={() => { setDescription(point.prompt); prompt.current?.focus(); }}>{point.label}<ArrowUpRight size={11} /></button>)}</div> : <div className="scent-prompt-after"><span>{dirty ? "Your description changed. Submit to create a new edit." : "Your words. A different way into fragrance."}</span><button onClick={reset}><RotateCcw size={12} />Start again</button></div>}
      {!submitted && <p className="scent-quiet-note">A personal edit from our current collection. No account needed.</p>}
    </section>
    <AnimatePresence>{submitted && <motion.section ref={results} key="personal-edit" tabIndex={-1} className="scent-edit" aria-labelledby="scent-edit-title" initial={reduced ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: reduced ? 0 : .15 } }} transition={{ duration: reduced ? 0 : .6, ease }}>
      <header className="scent-edit-heading"><div><p className="scent-small-label">FROM YOUR WORDS TO YOUR WARDROBE</p><h2 id="scent-edit-title">{matches.length ? "This could be the beginning." : "Not quite the right fit. Yet."}</h2></div><span role="status">{matches.length} {matches.length === 1 ? "scent to explore" : "scents to explore"}</span></header>
      <blockquote className="scent-brief">“{submitted.description}”{submitted.maxPrice && <small>Starting price up to {price(Number(submitted.maxPrice))}</small>}</blockquote>
      <div className="scent-suggestions" key={revision}>{matches.map((match, index) => <ScentSuggestion key={match.productId} product={products.find(product => product.id === match.productId)!} match={match} onProduct={onProduct} index={index} />)}</div>
      {!matches.length && <div className="scent-no-match"><p>There isn’t a convincing match in the catalogue for that brief. Try a different note, a little more room in your budget, or fewer exclusions.</p><button onClick={() => { prompt.current?.focus(); prompt.current?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "center" }); }}><ArrowLeft size={14} />Revisit my words</button><button onClick={onCollections}>Explore the collection<ArrowUpRight size={14} /></button></div>}
      <details className="scent-refinement"><summary><span>A little more personal?</span><span>Fine-tune this edit<ChevronDown size={15} /></span></summary><form onSubmit={submit}><div className="scent-refine-fields"><label>When you’ll wear it<select value={refinements.occasion} onChange={event => setRefinements(current => ({ ...current, occasion: event.target.value as ScentPreferences["occasion"] }))}><option value="any">Follow my description</option><option value="everyday">Everyday</option><option value="office">Work & daytime</option><option value="evening">Evenings</option></select></label><label>Your weather<select value={refinements.climate} onChange={event => setRefinements(current => ({ ...current, climate: event.target.value as ScentPreferences["climate"] }))}><option value="any">Follow my description</option><option value="warm">Warm & humid</option><option value="cool">Cooler days</option></select></label><label>Starting-price limit, PHP<input type="number" min="1" max="100000" step="1" placeholder={submitted.maxPrice || "No limit"} value={refinements.maxPrice} onChange={event => setRefinements(current => ({ ...current, maxPrice: event.target.value }))} /></label></div><fieldset><legend>Leave these out</legend><div className="scent-refine-avoids">{["sweet", "vanilla", "oud", "smoky", "floral", "spicy", "leather"].map(note => <button type="button" aria-pressed={refinements.avoids.includes(note)} key={note} onClick={() => setRefinements(current => ({ ...current, avoids: current.avoids.includes(note) ? current.avoids.filter(item => item !== note) : [...current.avoids, note] }))}>{refinements.avoids.includes(note) && <X size={11} />}{note}</button>)}</div></fieldset><button className="scent-refine-submit" type="submit" disabled={!description.trim()}>Update my edit<ArrowRight size={14} /></button></form></details>
      <p className="scent-edit-footnote">A starting point based on listed notes, not a promise of personal taste or performance. Try a little on skin before committing to more.</p>
    </motion.section>}</AnimatePresence>
  </div>;
}
