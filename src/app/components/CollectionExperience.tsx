import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Grid2X2, Columns3, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { ShopProductCard, type StoreProduct } from "./StorefrontInterfaces";
import { catalogFacets, catalogPrice, categoryLabel, EMPTY_CATALOG, matchesCatalog, priceError, selectCatalog, SORT_OPTIONS, type CatalogState, type FacetKey } from "../../lib/catalog";

type Props = {
  products: StoreProduct[]; state: CatalogState; onChange: (state: CatalogState) => void;
  images: Record<string, string>; onProduct: (product: StoreProduct) => void; onHome: () => void; onFinder: () => void;
};
const money = (value: number) => `PHP ${value.toLocaleString("en-PH")}`;
const toggle = (values: string[], value: string) => values.includes(value) ? values.filter(item => item !== value) : [...values, value];
const freshState = (): CatalogState => ({ ...EMPTY_CATALOG, categories: [], families: [], brands: [] });

function FilterControls({ products, state, onChange }: Pick<Props, "products" | "state" | "onChange">) {
  const id = useId();
  const error = priceError(state);
  const sizes = [...new Set(products.flatMap(product => product.sizes.map(size => size.label)))].sort((a, b) => parseFloat(a) - parseFloat(b));
  const sections: { key: FacetKey; title: string }[] = [{ key: "categories", title: "Collections" }, { key: "families", title: "Fragrance family" }, { key: "brands", title: "Brand" }];
  return <div className="collection-filter-controls">
    {sections.map(({ key, title }) => <details key={key} open className="collection-filter-group"><summary>{title}<span>{state[key].length || ""}</span><ChevronDown size={15} /></summary>
      <fieldset><legend className="collection-sr-only">{title}</legend>{catalogFacets(products, state, key).map(({ value, count }) => <label className={`collection-check ${!count && !state[key].includes(value) ? "is-unavailable" : ""}`} key={value}>
        <input type="checkbox" checked={state[key].includes(value)} disabled={!count && !state[key].includes(value)} onChange={() => onChange({ ...state, [key]: toggle(state[key], value) })} />
        <span className="collection-check-box"><Check size={11} strokeWidth={2} /></span><span>{key === "categories" ? categoryLabel(value) : value}</span><small>{count}</small>
      </label>)}</fieldset>
    </details>)}
    <details className="collection-filter-group" open><summary>Decant size<ChevronDown size={15} /></summary><fieldset className="collection-size-filter"><legend className="collection-sr-only">Filter by decant size</legend>
      {[{ value: "", label: "Any size" }, ...sizes.map(size => ({ value: size, label: size }))].map(({ value, label }) => <label key={value}><input type="radio" name={`${id}-size`} checked={state.size === value} onChange={() => onChange({ ...state, size: value })} /><span>{label}</span></label>)}
    </fieldset></details>
    <details className="collection-filter-group" open><summary>Price range<ChevronDown size={15} /></summary><p className="collection-filter-note">{state.size ? `Price for one ${state.size} decant.` : "Based on each fragrance’s starting price."}</p>
      <div className="collection-price-fields"><label htmlFor={`${id}-min`}>Min · PHP<input id={`${id}-min`} type="number" min="0" step="any" inputMode="decimal" placeholder="0" value={state.minPrice} aria-invalid={!!error} aria-describedby={error ? `${id}-price-error` : undefined} onChange={event => onChange({ ...state, minPrice: event.target.value })} /></label>
        <span aria-hidden="true">—</span><label htmlFor={`${id}-max`}>Max · PHP<input id={`${id}-max`} type="number" min="0" step="any" inputMode="decimal" placeholder="Any" value={state.maxPrice} aria-invalid={!!error} aria-describedby={error ? `${id}-price-error` : undefined} onChange={event => onChange({ ...state, maxPrice: event.target.value })} /></label></div>
      {error && <p className="collection-price-error" id={`${id}-price-error`} role="alert">{error} This range is not applied yet.</p>}
    </details>
    <label className="collection-check collection-bestseller-filter"><input type="checkbox" checked={state.bestSellers} onChange={() => onChange({ ...state, bestSellers: !state.bestSellers })} /><span className="collection-check-box"><Check size={11} /></span><span>Bestsellers only</span><small>{products.filter(product => product.bestSeller && matchesCatalog(product, state, "bestSellers")).length}</small></label>
    <p className="collection-filter-note">Choose several options within a group. Different groups narrow your selection together.</p>
  </div>;
}

function FilterDialog({ open, onClose, products, state, onChange }: Pick<Props, "products" | "state" | "onChange"> & { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(state);
  const count = selectCatalog(products, draft).length;
  useEffect(() => {
    const node = dialog.current;
    if (!open || !node) return;
    setDraft(state);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    node.showModal();
    return () => { node.close(); document.body.style.overflow = previousOverflow; };
    // Draft selections are intentionally isolated until the customer applies them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return <dialog className="collection-filter-dialog" ref={dialog} aria-labelledby="collection-dialog-title" onCancel={onClose} onClose={() => { if (!dialog.current?.open) onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="collection-drawer"><header><div><p className="collection-eyebrow">MAKE IT YOURS</p><h2 id="collection-dialog-title">Refine your discovery.</h2></div><button aria-label="Close filters" onClick={onClose}><X size={22} strokeWidth={1.2} /></button></header>
      <div className="collection-drawer-body"><button className="collection-text-link" onClick={() => setDraft(freshState())}>Reset filters</button><FilterControls products={products} state={draft} onChange={setDraft} /></div>
      <footer><button className="collection-button" disabled={!!priceError(draft)} onClick={() => { onChange(draft); onClose(); }}>Show {count} fragrance{count === 1 ? "" : "s"}<ArrowRight size={16} /></button><button className="collection-text-link" onClick={onClose}>Cancel</button></footer>
    </div>
  </dialog>;
}

export function CollectionExperience({ products, state, onChange, images, onProduct, onHome, onFinder }: Props) {
  const reduced = useReducedMotion();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [compact, setCompact] = useState(true);
  const results = useMemo(() => selectCatalog(products, state), [products, state]);
  const categories = catalogFacets(products, state, "categories");
  const chips = [
    ...(["categories", "families", "brands"] as FacetKey[]).flatMap(key => state[key].map(value => ({ key: `${key}-${value}`, label: key === "categories" ? categoryLabel(value) : value, remove: () => onChange({ ...state, [key]: state[key].filter(item => item !== value) }) }))),
    ...(state.size ? [{ key: "size", label: `${state.size} decants`, remove: () => onChange({ ...state, size: "" }) }] : []),
    ...(state.bestSellers ? [{ key: "bestSellers", label: "Bestsellers", remove: () => onChange({ ...state, bestSellers: false }) }] : []),
    ...(!priceError(state) && (state.minPrice || state.maxPrice) ? [{ key: "price", label: `${state.minPrice ? money(Number(state.minPrice)) : "Any price"} – ${state.maxPrice ? money(Number(state.maxPrice)) : "and up"}`, remove: () => onChange({ ...state, minPrice: "", maxPrice: "" }) }] : []),
  ];
  const activeCount = chips.length;
  const reset = () => onChange(freshState());
  const minimum = Math.min(...products.map(product => catalogPrice(product)));
  return <div className="collection-experience">
    <section className="collection-intro"><div className="collection-shell"><nav className="collection-breadcrumb" aria-label="Breadcrumb"><button onClick={onHome}>Home</button><span>/</span><span aria-current="page">Collections</span></nav>
      <motion.div className="collection-masthead" initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
        <div className="collection-masthead-top"><p className="collection-eyebrow">THE DECANT EDIT</p><span>A WARDROBE OF POSSIBILITIES</span><span>VOL. 01</span></div>
        <div className="collection-masthead-title"><h1>The scent wardrobe<span>.</span></h1></div>
        <div className="collection-masthead-bottom"><p>One for the everyday. Another for the evening.<br /><em>Who says you need just one signature?</em></p><div><span>{products.length} fragrances</span><i /><span>{categories.length} scent stories</span><i /><span>From {money(minimum)}</span></div></div>
      </motion.div>
      <div className="collection-category-heading"><p>EXPLORE BY FEELING</p><button className="collection-text-link" onClick={() => onChange({ ...state, categories: [] })} disabled={!state.categories.length}>All collections<ArrowUpRight size={13} /></button></div>
      <div className="collection-category-rail" role="group" aria-label="Explore fragrance collections">{categories.map(({ value }) => <button key={value} className="collection-category" aria-pressed={state.categories.includes(value)} onClick={() => onChange({ ...state, categories: state.categories.length === 1 && state.categories[0] === value ? [] : [value] })}>
        <img src={images[value] ?? images.hero} alt="" /><span className="collection-category-shade" /><span className="collection-category-name">{categoryLabel(value)}<small>{products.filter(product => product.category === value).length} fragrance{products.filter(product => product.category === value).length === 1 ? "" : "s"}</small></span><span className="collection-category-icon">{state.categories.includes(value) ? <Check size={14} /> : <ArrowUpRight size={14} />}</span>
      </button>)}</div>
    </div></section>

    <section className="collection-shop collection-shell" aria-labelledby="collection-results-title"><aside className="collection-sidebar" aria-label="Filter fragrances"><div className="collection-sidebar-heading"><h2>Refine your selection</h2><button className="collection-text-link" onClick={reset} disabled={!activeCount && !state.query}>Reset</button></div><FilterControls products={products} state={state} onChange={onChange} /><div className="collection-concierge"><Sparkles size={21} strokeWidth={1} /><h3>A little guidance?</h3><p>Let your preferences lead the way.</p><button className="collection-text-link" onClick={onFinder}>Find your scent<ArrowUpRight size={13} /></button></div></aside>
      <div className="collection-results"><div className="collection-results-heading"><div><p className="collection-eyebrow">CURATED, NOT COMPLICATED</p><h2 id="collection-results-title">The collection.</h2></div><p>{state.size ? `${state.size} decant prices` : "Starting prices · choose a size on each card"}</p></div>
        <div className="collection-toolbar"><label className="collection-search"><Search size={16} strokeWidth={1.4} /><span className="collection-sr-only">Search the collection</span><input type="search" maxLength={200} placeholder="A fragrance, a brand, a note…" value={state.query} onChange={event => onChange({ ...state, query: event.target.value })} />{state.query && <button aria-label="Clear collection search" onClick={() => onChange({ ...state, query: "" })}><X size={15} /></button>}</label>
          <div className="collection-toolbar-bottom"><button className="collection-mobile-filter" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={15} />Filter{activeCount > 0 && <span>{activeCount}</span>}</button><p role="status" aria-live="polite" aria-atomic="true">{results.length} fragrance{results.length === 1 ? "" : "s"}</p><label className="collection-sort"><span>Sort by</span><select aria-label="Sort fragrances" value={state.sort} onChange={event => onChange({ ...state, sort: event.target.value as CatalogState["sort"] })}>{SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><ChevronDown size={13} /></label>
            <div className="collection-density" role="group" aria-label="Product grid density"><button aria-label="Comfortable grid" aria-pressed={!compact} onClick={() => setCompact(false)}><Columns3 size={17} /></button><button aria-label="Compact grid" aria-pressed={compact} onClick={() => setCompact(true)}><Grid2X2 size={17} /></button></div></div>
        </div>
        {!!chips.length && <div className="collection-active-filters" aria-label="Applied filters">{chips.map(chip => <button key={chip.key} aria-label={`Remove ${chip.label} filter`} onClick={chip.remove}>{chip.label}<X size={12} /></button>)}<button className="collection-clear" onClick={reset}>Clear all</button></div>}
        {priceError(state) && <p className="collection-price-error" role="alert">{priceError(state)} The price range is not applied.</p>}
        {!results.length ? <div className="collection-no-results"><Search size={28} strokeWidth={1} /><p className="collection-eyebrow">A DIFFERENT DIRECTION</p><h3>No fragrances in this edit.</h3><p>Try removing a filter or searching for a broader note. Your next favourite may be a little unexpected.</p><button className="collection-button" onClick={reset}>Explore all fragrances<ArrowRight size={16} /></button><button className="collection-text-link" onClick={onFinder}>Help me find my scent<ArrowUpRight size={14} /></button></div>
          : <div className={`collection-product-grid ${compact ? "is-compact" : ""}`}>{results.map(product => <div key={`${product.id}-${state.size}`} className="collection-product"><ShopProductCard product={product} preferredSize={state.size} onOpen={() => onProduct(product)} /></div>)}</div>}
        {!!results.length && <div className="collection-end"><span /><p>You've explored {results.length} of {products.length} fragrances.</p><span /></div>}
      </div>
    </section>
    <div className="collection-closing collection-shell"><div><Sparkles size={21} strokeWidth={1} /><p>A signature scent is personal.<br /><em>Finding it should be, too.</em></p></div><button className="collection-text-link" onClick={onFinder}>Find your scent<ArrowRight size={16} /></button><button className="collection-back-top" onClick={() => window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" })}><ArrowLeft size={13} />Back to top</button></div>
    <FilterDialog open={filtersOpen} onClose={() => setFiltersOpen(false)} products={products} state={state} onChange={onChange} />
  </div>;
}
