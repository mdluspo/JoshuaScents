export const catalog = [
  { id: 1, name: "Bleu de Chanel", family: "Fresh", notes: "Fresh, Woody", sizes: { "2ml": 25000, "5ml": 48000, "10ml": 85000 } },
  { id: 2, name: "Sauvage EDP", family: "Fresh", notes: "Fresh, Spicy", sizes: { "2ml": 28000, "5ml": 53000, "10ml": 92000 } },
  { id: 3, name: "Aventus", family: "Fresh", notes: "Fruity, Chypre, Smoky", sizes: { "2ml": 65000, "5ml": 120000, "10ml": 210000 } },
  { id: 4, name: "Y EDP", family: "Woody", notes: "Fresh, Fougere", sizes: { "2ml": 26000, "5ml": 49000, "10ml": 88000 } },
  { id: 5, name: "Oud Wood", family: "Woody", notes: "Woody, Oud, Spicy", sizes: { "2ml": 58000, "5ml": 110000, "10ml": 190000 } },
  { id: 6, name: "La Nuit de L'Homme", family: "Woody", notes: "Spicy, Woody, Warm", sizes: { "2ml": 29000, "5ml": 55000, "10ml": 95000 } },
  { id: 7, name: "Grand Soir", family: "Warm & Spicy", notes: "Amber, Vanilla, Warm", sizes: { "2ml": 42000, "5ml": 79000, "10ml": 138000 } },
  { id: 8, name: "Black Orchid", family: "Warm & Spicy", notes: "Dark, Floral, Earthy", sizes: { "2ml": 37000, "5ml": 70000, "10ml": 120000 } },
  { id: 9, name: "Baccarat Rouge 540", family: "Floral", notes: "Floral, Woody, Musky", sizes: { "2ml": 85000, "5ml": 160000, "10ml": 280000 } },
  { id: 10, name: "Dior Homme Intense", family: "Floral", notes: "Iris, Lavender, Leather", sizes: { "2ml": 32000, "5ml": 61000, "10ml": 105000 } },
  { id: 11, name: "Tobacco Vanille", family: "Warm & Spicy", notes: "Tobacco, Vanilla, Spice", sizes: { "2ml": 59000, "5ml": 112000, "10ml": 195000 } },
  { id: 12, name: "Terre d'Hermes", family: "Woody", notes: "Woody, Earthy, Citrus", sizes: { "2ml": 30000, "5ml": 57000, "10ml": 99000 } },
] as const;

export function priceCart(items: Array<{ productId: number; size: string; quantity: number }>) {
  return items.map((item) => {
    const product = catalog.find((candidate) => candidate.id === item.productId);
    const unitPrice = product?.sizes[item.size as keyof typeof product.sizes];
    if (!product || !unitPrice) throw new Error(`Invalid product variant: ${item.productId}/${item.size}`);
    return { ...item, productName: product.name, unitPrice, lineTotal: unitPrice * item.quantity };
  });
}
