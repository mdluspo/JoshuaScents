import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUpRight, Compass, Search } from "lucide-react";
import { rankFragrances } from "../../lib/fragrance-search";
import { ShopProductCard, type StoreProduct } from "./StorefrontInterfaces";

const tidy = (value: string) => value.replaceAll("â€¢", "·").replaceAll("â€”", "—").replaceAll("HermÃ¨s", "Hermès");
const money = (value: number) => `PHP ${value.toLocaleString("en-PH")}`;
const suggestions = ["Citrus", "Vanilla", "Oud", "Woody", "Iris"];
type ProductAction = (product: StoreProduct) => void;


export function SearchExperience({ products, query, onSearch, onProduct, onCollections }: { products: StoreProduct[]; query: string; onSearch: (query: string) => void; onProduct: ProductAction; onCollections: () => void }) {
  const [draft, setDraft] = useState(query);
  const [sort, setSort] = useState("relevance");
  useEffect(() => { setDraft(query); setSort("relevance"); }, [query]);
  const matches = rankFragrances(products, query);
  const shown = [...matches].sort((a, b) => sort === "price-asc" ? a.price - b.price : sort === "price-desc" ? b.price - a.price : 0);
  return <div className="fragrance-experience"><div className="fx-wrap fx-search-page"><p className="fx-kicker">THE FRAGRANCE LIBRARY</p><h1>A little closer<br />to your <em>signature.</em></h1><form className="fx-search-form" onSubmit={event => { event.preventDefault(); onSearch(draft.trim()); }}><Search size={20} strokeWidth={1.2} /><input aria-label="Search the collection" maxLength={200} placeholder="Search by name, note, family or brand" value={draft} onChange={event => setDraft(event.target.value)} /><button type="submit" aria-label="Search collection"><ArrowRight size={20} /></button></form>
    <div className="fx-toolbar"><p role="status">{query.trim() ? <>{shown.length} {shown.length === 1 ? "fragrance" : "fragrances"} for <strong>“{query}”</strong></> : "Start with a name or note to explore."}</p><label>Sort by<select value={sort} onChange={event => setSort(event.target.value)}><option value="relevance">Relevance</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label></div>
    {shown.length ? <div className="fx-product-grid">{shown.map(product => <ShopProductCard product={product} key={product.id} onOpen={() => onProduct(product)} />)}</div> : <div className="fx-empty"><Compass size={30} strokeWidth={1} /><h2>A different note, perhaps?</h2><p>Try “vanilla,” “woody,” or part of a fragrance name. You can also explore the full collection.</p><div className="fx-chips">{suggestions.map(word => <button key={word} onClick={() => onSearch(word)}>{word}</button>)}</div><button className="fx-text-link" onClick={onCollections}>Explore all fragrances<ArrowUpRight size={15} /></button></div>}
  </div></div>;
}

export { ScentExperience } from "./ScentStudio";
export { DecantGuideExperience } from "./DecantCompanion";

export function BestSellersExperience({ products, onProduct, onCollections, onFinder, image }: { products: StoreProduct[]; onProduct: ProductAction; onCollections: () => void; onFinder: () => void; image: string }) {
  const [family, setFamily] = useState("All");
  const [sort, setSort] = useState("edit");
  const [size, setSize] = useState("2ml");
  const best = products.filter(product => product.bestSeller);
  const families = ["All", ...new Set(best.map(product => product.family))];
  const cost = (product: StoreProduct) => product.sizes.find(option => option.label === size)?.price ?? product.price;
  const shown = best.filter(product => family === "All" || product.family === family).sort((a, b) => sort === "price-asc" ? cost(a) - cost(b) : sort === "price-desc" ? cost(b) - cost(a) : a.id - b.id);
  return <div className="fragrance-experience fx-bestsellers"><section className="fx-signature-hero fx-wrap"><div className="fx-signature-copy"><p className="fx-kicker">THE SIGNATURE EDIT</p><h1>Worth getting<br /><em>to know.</em></h1><p className="fx-lead">A fresh first impression. A warmer after-dark ritual. Discover the fragrances at the heart of our collection.</p><a href="#signature-edit" className="fx-primary">Meet the edit<ArrowDown size={15} /></a><span className="fx-hero-caption">A SMALLER BOTTLE. A MORE PERSONAL CHOICE.</span></div><figure className="fx-signature-still"><img className="fx-still-bg" src={image} alt="Glass fragrance atomizers resting on cream silk" /></figure></section>
    <section className="fx-wrap fx-edit-section" id="signature-edit"><div className="fx-section-heading"><div><p className="fx-kicker">EXPLORE THE FAVOURITES</p><h2>Good company for your collection.</h2></div><button className="fx-text-link" onClick={onCollections}>The full collection<ArrowUpRight size={15} /></button></div><div className="fx-chips fx-family-filter" role="group" aria-label="Filter best sellers by fragrance family">{families.map(value => <button aria-pressed={family === value} key={value} onClick={() => setFamily(value)}>{value}<small>{value === "All" ? best.length : best.filter(product => product.family === value).length}</small></button>)}</div>
      <div className="fx-toolbar"><p role="status">{shown.length} {shown.length === 1 ? "fragrance" : "fragrances"} · find your own favourite</p><div><label>Decant size<select value={size} onChange={event => setSize(event.target.value)}>{["2ml", "5ml", "10ml"].map(value => <option key={value}>{value}</option>)}</select></label><label>Sort by<select value={sort} onChange={event => setSort(event.target.value)}><option value="edit">Our edit</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label></div></div><div className="fx-product-grid">{shown.map(product => <ShopProductCard key={`${product.id}-${size}`} product={product} preferredSize={size} onOpen={() => onProduct(product)} />)}</div><p className="fx-footnote">A curated prototype selection, not a live sales ranking. Product images illustrate our decant containers.</p>
    </section><section className="fx-wrap"><div className="fx-personal-note"><Compass size={31} strokeWidth={.9} /><div><p className="fx-kicker">THE BEST SCENT IS PERSONAL</p><h2>Popular is a beginning. You are the story.</h2><p>Let your notes, your days and your dislikes shape a more personal edit.</p></div><button className="fx-text-link" onClick={onFinder}>Find your scent<ArrowUpRight size={16} /></button></div></section>
  </div>;
}

