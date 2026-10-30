import type { StoreProduct } from "../app/components/StorefrontInterfaces";

export const SORT_OPTIONS = [
  ["featured", "Featured"], ["bestsellers", "Bestsellers first"],
  ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"],
  ["name-asc", "Name: A–Z"], ["name-desc", "Name: Z–A"],
] as const;
export type CatalogSort = typeof SORT_OPTIONS[number][0];
export interface CatalogState {
  categories: string[]; families: string[]; brands: string[]; bestSellers: boolean;
  query: string; sort: CatalogSort; size: string; minPrice: string; maxPrice: string;
}
export type FacetKey = "categories" | "families" | "brands";
export const EMPTY_CATALOG: CatalogState = { categories: [], families: [], brands: [], bestSellers: false, query: "", sort: "featured", size: "", minPrice: "", maxPrice: "" };
export const catalogText = (value: string) => value.replaceAll("â€¢", " · ").replaceAll("â€”", "—").replaceAll("HermÃ¨s", "Hermès");
const searchText = (value: string) => catalogText(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export const categoryLabel = (value: string) => value.toLowerCase().replace(/(^|\s)\S/g, letter => letter.toUpperCase());
export function normalizeCatalog(input: Partial<CatalogState> = {}): CatalogState {
  const list = (value: unknown) => Array.isArray(value) ? [...new Set(value.filter((v): v is string => typeof v === "string" && !!v.trim()))].slice(0, 30) : [];
  const price = (value: unknown) => typeof value === "string" && value.trim() && Number.isFinite(Number(value)) && Number(value) >= 0 ? value.trim() : "";
  return { categories: list(input.categories), families: list(input.families), brands: list(input.brands).filter(v => v !== "All Brands"), bestSellers: input.bestSellers === true,
    query: typeof input.query === "string" ? input.query.slice(0, 200) : "", sort: SORT_OPTIONS.some(([value]) => value === input.sort) ? input.sort! : "featured",
    size: typeof input.size === "string" ? input.size : "", minPrice: price(input.minPrice), maxPrice: price(input.maxPrice) };
}
export function priceError(state: Pick<CatalogState, "minPrice" | "maxPrice">): string {
  if ([state.minPrice, state.maxPrice].some(value => value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0))) return "Use a valid, non-negative price.";
  return state.minPrice !== "" && state.maxPrice !== "" && Number(state.minPrice) > Number(state.maxPrice) ? "Minimum price must not exceed maximum price." : "";
}
export function catalogPrice(product: StoreProduct, size = "") {
  return size ? product.sizes.find(option => option.label === size)?.price ?? Infinity : Math.min(...product.sizes.map(option => option.price));
}
export function matchesCatalog(product: StoreProduct, state: CatalogState, exclude?: FacetKey | "bestSellers") {
  const haystack = searchText([product.name, product.brand, product.family, product.category, product.notes].join(" "));
  const words = haystack.split(" ");
  if (!searchText(state.query).split(" ").filter(Boolean).every(term => words.some(word => word.startsWith(term)))) return false;
  for (const [key, value] of [["categories", product.category], ["families", product.family], ["brands", product.brand]] as const) {
    if (key !== exclude && state[key].length && !state[key].includes(value)) return false;
  }
  if (exclude !== "bestSellers" && state.bestSellers && !product.bestSeller) return false;
  const price = catalogPrice(product, state.size);
  if (!Number.isFinite(price)) return false;
  if (!priceError(state) && ((state.minPrice !== "" && price < Number(state.minPrice)) || (state.maxPrice !== "" && price > Number(state.maxPrice)))) return false;
  return true;
}
export function selectCatalog(products: StoreProduct[], state: CatalogState) {
  const compareName = (a: StoreProduct, b: StoreProduct) => catalogText(a.name).localeCompare(catalogText(b.name), "en", { sensitivity: "base" });
  return products.filter(product => matchesCatalog(product, state)).sort((a, b) => {
    switch (state.sort) {
      case "price-asc": return catalogPrice(a, state.size) - catalogPrice(b, state.size) || compareName(a, b);
      case "price-desc": return catalogPrice(b, state.size) - catalogPrice(a, state.size) || compareName(a, b);
      case "name-asc": return compareName(a, b);
      case "name-desc": return compareName(b, a);
      case "bestsellers": return Number(b.bestSeller) - Number(a.bestSeller) || a.id - b.id;
      default: return a.id - b.id;
    }
  });
}
export function catalogFacets(products: StoreProduct[], state: CatalogState, key: FacetKey) {
  const field = { categories: "category", families: "family", brands: "brand" } as const;
  return [...new Set([...products.map(product => product[field[key]]), ...state[key]])].sort((a, b) => a.localeCompare(b)).map(value => ({ value,
    count: products.filter(product => product[field[key]] === value && matchesCatalog(product, state, key)).length }));
}
export function catalogFromSearch(search: string): CatalogState {
  const params = new URLSearchParams(search);
  return normalizeCatalog({ categories: params.getAll("category"), families: params.getAll("family"), brands: params.getAll("brand"), bestSellers: params.get("bestsellers") === "1", query: params.get("q") ?? "", sort: params.get("sort") as CatalogSort, size: params.get("size") ?? "", minPrice: params.get("min") ?? "", maxPrice: params.get("max") ?? "" });
}
export function catalogUrl(href: string, state: CatalogState | null) {
  const url = new URL(href);
  for (const key of ["view", "category", "family", "brand", "bestsellers", "q", "sort", "size", "min", "max"]) url.searchParams.delete(key);
  url.hash = "";
  if (state) {
    url.searchParams.set("view", "collections");
    for (const [key, values] of [["category", state.categories], ["family", state.families], ["brand", state.brands]] as const) values.forEach(value => url.searchParams.append(key, value));
    if (state.query.trim()) url.searchParams.set("q", state.query.trim());
    if (state.sort !== "featured") url.searchParams.set("sort", state.sort);
    if (state.size) url.searchParams.set("size", state.size);
    if (state.bestSellers) url.searchParams.set("bestsellers", "1");
    if (!priceError(state)) { if (state.minPrice) url.searchParams.set("min", state.minPrice); if (state.maxPrice) url.searchParams.set("max", state.maxPrice); }
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
