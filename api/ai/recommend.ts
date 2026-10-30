import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { catalog } from "../_lib/catalog.js";
import { ApiError, allowMethods, handleApiError, noStore, requiredEnv, providerFetch } from "../_lib/http.js";
import { plainText } from "../_lib/validation.js";

const recommendationSchema = z.object({ recommendations: z.array(z.object({ productId: z.number().int().positive(), reason: plainText(1, 350) }).strict()).length(3) }).strict();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    allowMethods(req, res, ["POST"]);
    noStore(res);
    const parsed = z.object({ preference: plainText(10, 600) }).strict().safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Tell us a little more about the scent you want");
    const response = await providerFetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${requiredEnv("OPENAI_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        input: [
          { role: "system", content: "You are a concise fragrance adviser. Recommend exactly three product IDs only from the supplied catalog. Never invent products or medical claims. Return JSON with recommendations: [{productId, reason}]." },
          { role: "user", content: JSON.stringify({ preference: parsed.data.preference, catalog }) },
        ],
        text: { format: { type: "json_schema", name: "recommendations", strict: true, schema: {
          type: "object", additionalProperties: false, required: ["recommendations"], properties: {
            recommendations: { type: "array", minItems: 3, maxItems: 3, items: { type: "object", additionalProperties: false, required: ["productId", "reason"], properties: { productId: { type: "integer" }, reason: { type: "string" } } } },
          },
        } } },
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(502, "The scent adviser is temporarily unavailable", data);
    const text = data.output?.flatMap((item: any) => item.content ?? []).find((item: any) => item.type === "output_text")?.text;
    let output: unknown;
    try { output = typeof text === "string" && text.length <= 6000 ? JSON.parse(text) : null; } catch { output = null; }
    const checked = recommendationSchema.safeParse(output);
    if (!checked.success || new Set(checked.data.recommendations.map(item => item.productId)).size !== 3 || checked.data.recommendations.some(item => !catalog.some(product => product.id === item.productId))) throw new ApiError(502, "The scent adviser could not produce a valid recommendation. Please try again.");
    return res.status(200).json({ recommendations: checked.data.recommendations.map(item => ({ productId: item.productId, reason: item.reason, product: catalog.find(product => product.id === item.productId) })) });
  } catch (error) { return handleApiError(res, error); }
}
