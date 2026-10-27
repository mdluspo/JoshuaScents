import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { catalog } from "../_lib/catalog.js";
import { ApiError, allowMethods, handleApiError, noStore, requiredEnv } from "../_lib/http.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    allowMethods(req, res, ["POST"]);
    noStore(res);
    const parsed = z.object({ preference: z.string().trim().min(10).max(600) }).safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Tell us a little more about the scent you want");
    const response = await fetch("https://api.openai.com/v1/responses", {
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
    const recommendations = JSON.parse(text ?? "{}").recommendations ?? [];
    return res.status(200).json({ recommendations: recommendations.map((item: any) => ({
      ...item, product: catalog.find((product) => product.id === item.productId),
    })).filter((item: any) => item.product) });
  } catch (error) { return handleApiError(res, error); }
}
