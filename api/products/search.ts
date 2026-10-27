import type { VercelRequest, VercelResponse } from "@vercel/node";
import { catalog } from "../_lib/catalog.js";
import { ApiError, allowMethods, handleApiError, noStore } from "../_lib/http.js";

function normalize(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    allowMethods(req, res, ["GET"]);
    noStore(res);
    const query = typeof req.query.q === "string" ? normalize(req.query.q) : "";
    if (!query) return res.status(200).json({ products: [] });
    const terms = query.split(/\s+/).filter(Boolean);
    const products = catalog
      .filter((product) => {
        const words = normalize(product.name).split(/\s+/);
        return terms.every((term) => words.some((word) => word.startsWith(term)));
      })
      .map(({ id, name }) => ({ id, name }));
    return res.status(200).json({ products });
  } catch (error) {
    return handleApiError(res, error instanceof ApiError ? error : new Error("Search failed"));
  }
}
