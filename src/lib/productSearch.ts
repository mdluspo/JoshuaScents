export type ProductSearchResult = { products: Array<{ id: number; name: string }> };

export async function searchProducts(query: string): Promise<ProductSearchResult> {
  const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error("Product search failed");
  return response.json() as Promise<ProductSearchResult>;
}
