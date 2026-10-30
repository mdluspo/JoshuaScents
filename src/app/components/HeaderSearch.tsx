import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { rankFragrances } from "../../lib/fragrance-search";
import type { StoreProduct } from "./StorefrontInterfaces";

export function HeaderSearch({ open, onOpenChange, products, onProduct, onSearch }: { open: boolean; onOpenChange: (open: boolean) => void; products: StoreProduct[]; onProduct: (product: StoreProduct) => void; onSearch: (query: string) => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const container = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const results = rankFragrances(products, query).slice(0, 6);
  useEffect(() => {
    if (open) input.current?.focus();
    else { setQuery(""); setActive(-1); }
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!container.current?.contains(event.target as Node)) onOpenChange(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open, onOpenChange]);
  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!query.trim()) return;
    if (active >= 0 && results[active]) onProduct(results[active]);
    else onSearch(query.trim());
    onOpenChange(false);
  }
  return <div className={`header-search ${open ? "is-open" : ""}`} ref={container} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onOpenChange(false); }} onKeyDown={event => {
    if (event.key === "Escape") { event.preventDefault(); onOpenChange(false); toggle.current?.focus(); }
  }}>
    <form className="header-search-field" onSubmit={submit} aria-hidden={!open}><input ref={input} aria-label="Search fragrances" role="combobox" aria-autocomplete="list" aria-expanded={open && !!query.trim()} aria-controls="header-fragrance-results" aria-activedescendant={active >= 0 ? `header-fragrance-${active}` : undefined} tabIndex={open ? 0 : -1} disabled={!open} maxLength={200} value={query} onChange={event => { setQuery(event.target.value); setActive(-1); }} autoComplete="off" placeholder="Search fragrances…" onKeyDown={event => {
      if (event.key === "ArrowDown" && results.length) { event.preventDefault(); setActive(index => (index + 1) % results.length); }
      if (event.key === "ArrowUp" && results.length) { event.preventDefault(); setActive(index => index <= 0 ? results.length - 1 : index - 1); }
    }} /><button type="button" tabIndex={open ? 0 : -1} onClick={() => { onOpenChange(false); toggle.current?.focus(); }} aria-label="Close search"><X size={13} strokeWidth={1.2} /></button></form>
    <button type="button" ref={toggle} className="header-search-toggle" aria-label={open ? "Submit fragrance search" : "Search fragrances"} aria-expanded={open} aria-controls="header-search-suggestions" onClick={() => { if (!open) onOpenChange(true); else if (query.trim()) submit(); else { onOpenChange(false); } }}><Search size={19} strokeWidth={1.3} /></button>
    {open && query.trim() && <div className="header-search-results" id="header-search-suggestions"><p className="header-search-count" role="status">{results.length ? "In the collection" : "No matches. Try a name or another note."}</p><ul role="listbox" id="header-fragrance-results" aria-label="Matching fragrances">{results.map((product, index) => <li role="option" id={`header-fragrance-${index}`} aria-selected={active === index} key={product.id}><button type="button" tabIndex={-1} onClick={() => { onProduct(product); onOpenChange(false); }}><img src={product.img} alt="" /><span><strong>{product.name}</strong><small>{product.family}</small></span><em>PHP {product.price.toLocaleString("en-PH")}</em></button></li>)}</ul><button type="button" className="header-search-all" onClick={() => { onSearch(query.trim()); onOpenChange(false); }}>View all results<ArrowRight size={13} /></button></div>}
  </div>;
}
