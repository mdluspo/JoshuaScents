export type ProductSearchResult = { products: Array<{ id: number; name: string }> };

export async function searchProducts(query: string): Promise<ProductSearchResult> {
  const response = await fetch(`/api/products/search?q=${encodeURIComponent(query.slice(0, 200))}`, { signal: AbortSignal.timeout(8000), redirect: "error" });
  if (!response.ok) throw new Error("Product search failed");
  if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("Search API is unavailable in this preview");
  const data = await response.json();
  if (!Array.isArray(data.products) || data.products.some((item: unknown) => !item || typeof item !== "object" || !Number.isSafeInteger((item as { id: number }).id) || typeof (item as { name: string }).name !== "string")) throw new Error("Search returned invalid data");
  return data as ProductSearchResult;
}
