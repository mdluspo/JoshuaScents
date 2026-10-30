export interface SearchableFragrance {
  id: number; name: string; brand?: string; family?: string;
  category?: string; notes?: string; description?: string;
}

export function fragranceText(value: string) {
  return value.replaceAll("â€¢", " ").replaceAll("HermÃ¨s", "Hermès")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
const canonical = (word: string) => ({ woods: "wood", woody: "wood", flowers: "floral", flower: "floral", spiced: "spicy", spice: "spicy", smokey: "smoky", smoke: "smoky" }[word] ?? word);
const terms = (value: string) => fragranceText(value).split(" ").filter(Boolean).map(canonical);

// One edit (including a transposition), only for longer words. Short queries
// like Y or oud stay exact/prefix matches rather than matching unrelated names.
function nearWord(a: string, b: string) {
  if (a.length < 4 || b.length < 4 || Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    const changed = [...a].map((letter, i) => letter !== b[i] ? i : -1).filter(i => i >= 0);
    return changed.length === 1 || (changed.length === 2 && changed[1] === changed[0] + 1 && a[changed[0]] === b[changed[1]] && a[changed[1]] === b[changed[0]]);
  }
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  for (let i = 0; i < longer.length; i++) if (longer.slice(0, i) + longer.slice(i + 1) === shorter) return true;
  return false;
}

export function rankFragrances<T extends SearchableFragrance>(products: readonly T[], query: string): T[] {
  const phrase = fragranceText(query.slice(0, 200));
  const wanted = terms(query.slice(0, 200));
  if (!wanted.length) return [];
  return products.map(product => {
    const fields = [
      { words: terms(product.name), weight: 30 },
      { words: terms(product.brand ?? ""), weight: 22 },
      { words: terms(product.family ?? ""), weight: 12 },
      // Editorial collection names are not ingredient lists. "Golden Vanilla"
      // can be searched as a collection, but must not tag every member vanilla.
      { words: fragranceText(product.category ?? "") === phrase ? terms(product.category ?? "") : [], weight: 11 },
      { words: terms(product.notes ?? ""), weight: 10 },
      { words: terms(product.description ?? ""), weight: 4 },
    ];
    let score = fragranceText(product.name) === phrase ? 150 : fragranceText(product.name).includes(phrase) ? 70 : 0;
    for (const term of wanted) {
      const matches = fields.map(({ words, weight }) => words.some(word => word === term) ? weight : words.some(word => word.startsWith(term)) ? weight * .7 : words.some(word => nearWord(term, word)) ? weight * .35 : 0);
      const best = Math.max(...matches);
      if (!best) return { product, score: 0 };
      score += best;
    }
    return { product, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.product.id - b.product.id).map(item => item.product);
}
