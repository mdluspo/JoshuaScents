import { fragranceText, type SearchableFragrance } from "./fragrance-search.js";

export const SCENT_CHARACTERS = ["fresh", "woody", "floral", "amber", "sweet", "spicy", "smoky", "powdery", "fruity"] as const;
export type ScentCharacter = typeof SCENT_CHARACTERS[number];
export interface ScentPreferences {
  description: string; likes: string[]; avoids: string[];
  occasion: "any" | "everyday" | "office" | "evening";
  climate: "any" | "warm" | "cool"; maxPrice: string;
}
export const EMPTY_SCENT: ScentPreferences = { description: "", likes: [], avoids: [], occasion: "any", climate: "any", maxPrice: "" };
export function preferencesFromPrompt(input: ScentPreferences): ScentPreferences {
  const description = input.description.trim().slice(0, 600);
  const budget = description.match(/\b(?:under|below|maximum(?:\s+of)?|max|budget(?:\s+of)?|up to|no more than)\s*(?:php|p|₱)?\s*([\d,]+(?:\.\d{1,2})?)/i)
    ?? description.match(/(?:php|₱)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:max|budget|limit)/i);
  const amount = budget ? Number(budget[1].replaceAll(",", "")) : NaN;
  const words = fragranceText(description).split(" ");
  return { ...input, description,
    maxPrice: input.maxPrice.trim() || (Number.isFinite(amount) && amount >= 0 && amount <= 100000 ? String(amount) : ""),
    occasion: input.occasion === "any" && words.some(word => ["everyday", "daily", "daytime"].includes(word)) ? "everyday" : input.occasion,
    climate: input.climate === "any" && words.some(word => ["cooler", "cold", "winter"].includes(word)) ? "cool" : input.climate,
  };
}
const vocabulary: Record<string, string[]> = {
  fresh: ["fresh", "clean", "citrus", "lemon", "bergamot", "grapefruit", "airy", "light"],
  woody: ["woody", "wood", "woods", "forest", "cedar", "sandalwood", "vetiver", "rosewood", "oud"],
  floral: ["floral", "flower", "flowers", "rose", "jasmine", "iris", "lavender", "ylang"],
  amber: ["amber", "benzoin", "labdanum", "warm", "cozy", "cosy"],
  sweet: ["sweet", "sweetness", "gourmand", "vanilla", "tonka", "cacao", "chocolate", "dessert"],
  spicy: ["spicy", "spice", "pepper", "cardamom", "ginger", "anise", "saffron"],
  smoky: ["smoky", "smoke", "smokey", "tobacco", "birch"],
  powdery: ["powdery", "powder", "iris"], fruity: ["fruity", "fruit", "apple", "blackcurrant", "berry"],
  vanilla: ["vanilla"], oud: ["oud"], leather: ["leather"],
};
const has = (words: string[], term: string) => words.includes(term);
const namedNotes = new Set(["lemon", "bergamot", "grapefruit", "cedar", "sandalwood", "vetiver", "rosewood", "oud", "rose", "jasmine", "iris", "lavender", "ylang", "benzoin", "labdanum", "vanilla", "tonka", "cacao", "chocolate", "pepper", "cardamom", "ginger", "anise", "saffron", "tobacco", "birch", "apple", "blackcurrant", "leather"]);
function features(words: string[]) {
  return Object.entries(vocabulary).filter(([, aliases]) => aliases.some(alias => has(words, alias))).map(([feature]) => feature);
}
export function parseScentDescription(description: string) {
  const positive: string[] = [], negative: string[] = [], direct: string[] = [];
  let alternatives = false;
  // A dislike applies through a list ("no vanilla, oud or smoke"). A contrast
  // or a fresh preference phrase starts a new clause rather than leaking it.
  const clauses = description.toLowerCase().replace(/don[’']t/g, "do not")
    .replace(/\bno more than\s*(?:php|p|₱)?\s*[\d,]+(?:\.\d{1,2})?/g, " ")
    .split(/[.;!?]|\b(?:but|however|instead)\b/);
  for (const clause of clauses) {
    const words = fragranceText(clause).split(" ");
    let excluding = false;
    for (let i = 0; i < words.length; i++) {
      if (["no", "not", "without", "avoid", "hate", "dislike", "nothing", "less"].includes(words[i])) { excluding = true; continue; }
      if (["want", "like", "love", "prefer"].includes(words[i]) && i > 0 && ["i", "also"].includes(words[i - 1])) excluding = false;
      if (words[i] === "or" && !excluding) alternatives = true;
      const found = features([words[i]]);
      if (excluding) {
        // A named note is a precise exclusion: "no vanilla" must not exclude
        // every other sweet note. Broad characters remain broad exclusions.
        negative.push(...(Object.hasOwn(vocabulary, words[i]) ? [words[i]] : namedNotes.has(words[i]) ? [`note:${words[i]}`] : found));
      } else positive.push(...found);
      if (!excluding && found.length) direct.push(words[i]);
    }
  }
  return { likes: [...new Set(positive)], avoids: [...new Set(negative)], direct: [...new Set(direct)], alternatives };
}
export interface ScentMatch { productId: number; reason: string; notes: string[]; score: number }
type MatchableFragrance = SearchableFragrance & { price: number };
export function recommendScents(products: readonly MatchableFragrance[], input: ScentPreferences): ScentMatch[] {
  if (input.maxPrice.trim() && (!Number.isFinite(Number(input.maxPrice)) || Number(input.maxPrice) <= 0)) return [];
  const parsed = parseScentDescription(input.description.slice(0, 600));
  const avoids = [...new Set([...input.avoids, ...parsed.avoids])];
  const likes = [...new Set([...input.likes, ...parsed.likes])].filter(feature => !avoids.includes(feature));
  const requiredNotes = parsed.direct.filter(word => namedNotes.has(word));
  const descriptionWords = fragranceText(input.description).split(" ");
  const occasion = input.occasion !== "any" ? input.occasion : descriptionWords.some(word => ["office", "work"].includes(word)) ? "office" : descriptionWords.some(word => ["evening", "night", "date", "party"].includes(word)) ? "evening" : "any";
  const warm = input.climate === "warm" || (input.climate === "any" && descriptionWords.some(word => ["hot", "humid", "summer", "manila"].includes(word)));
  if (!likes.length && !avoids.length && occasion === "any" && !warm && input.climate === "any" && !input.maxPrice) return [];
  return products.map(product => {
    const words = fragranceText(`${product.family} ${product.notes} ${product.description ?? ""}`).split(" ");
    const traits = features(words);
    if (avoids.some(feature => feature.startsWith("note:") ? words.includes(feature.slice(5)) : traits.includes(feature)) || (input.maxPrice && product.price > Number(input.maxPrice))) return null;
    if (requiredNotes.length && !(parsed.alternatives ? requiredNotes.some(note => words.includes(note)) : requiredNotes.every(note => words.includes(note)))) return null;
    const matched = likes.filter(feature => traits.includes(feature));
    if (likes.length && !matched.length) return null;
    let score = matched.length * 6;
    const named = parsed.direct.filter(word => has(words, word));
    score += named.length * 4;
    if (occasion === "office" || occasion === "everyday" || warm) score += traits.includes("fresh") ? 5 : -2;
    if (occasion === "evening" || input.climate === "cool") score += traits.some(feature => ["amber", "smoky", "sweet", "powdery"].includes(feature)) ? 4 : 0;
    if (warm && traits.includes("sweet")) score -= 4;
    if (score <= 0 && (likes.length || occasion !== "any" || warm || input.climate === "cool")) return null;
    const notes = named.length ? named.slice(0, 3) : matched.slice(0, 3);
    const character = notes.length ? `Its listed ${notes.join(" / ")} character aligns with your preferences.` : `A ${product.family?.toLowerCase()} option within your selected limits.`;
    const context = (occasion === "office" || occasion === "everyday" || warm) && traits.includes("fresh") ? " The fresher profile suits your daytime or warm-weather brief." : occasion === "evening" && traits.some(feature => ["amber", "smoky", "sweet", "powdery"].includes(feature)) ? " Its richer profile follows your evening brief." : "";
    return { productId: product.id, notes, score, reason: character + context };
  }).filter((match): match is ScentMatch => match !== null).sort((a, b) => b.score - a.score || a.productId - b.productId).slice(0, 3);
}
