import type { VercelRequest, VercelResponse } from "@vercel/node";
import { catalog } from "../_lib/catalog.js";
import { rankFragrances } from "../../src/lib/fragrance-search.js";
import { ApiError, allowMethods, handleApiError, noStore } from "../_lib/http.js";

function normalize(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    allowMethods(req, res, ["GET"]);
    noStore(res);
    if (req.query.q !== undefined && (typeof req.query.q !== "string" || req.query.q.length > 200 || /[\u0000-\u001f\u007f]/.test(req.query.q))) throw new ApiError(400, "Use a search phrase of up to 200 characters.");
    const query = typeof req.query.q === "string" ? normalize(req.query.q) : "";
    if (!query) return res.status(200).json({ products: [] });
    const products = rankFragrances(catalog, query)
      .map(({ id, name }) => ({ id, name }));
    return res.status(200).json({ products });
  } catch (error) {
    return handleApiError(res, error instanceof ApiError ? error : new Error("Search failed"));
  }
}
