import { FRAGRANCE_CATALOG } from "../../src/lib/fragrance-catalog.js";

export const catalog = FRAGRANCE_CATALOG.map(product => ({
  ...product,
  sizes: Object.fromEntries(product.sizes.map(size => [size.label, Math.round(size.price * 100)])) as Record<string, number>,
}));

export function priceCart(items: Array<{ productId: number; size: string; quantity: number }>) {
  return items.map((item) => {
    const product = catalog.find((candidate) => candidate.id === item.productId);
    const unitPrice = product?.sizes[item.size as keyof typeof product.sizes];
    if (!product || !unitPrice) throw new Error(`Invalid product variant: ${item.productId}/${item.size}`);
    return { ...item, productName: product.name, unitPrice, lineTotal: unitPrice * item.quantity };
  });
}
