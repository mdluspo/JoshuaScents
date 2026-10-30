import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { ApiError, allowMethods, handleApiError, noStore, requiredEnv, providerFetch } from "../_lib/http.js";
import { plainText } from "../_lib/validation.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    allowMethods(req, res, ["POST"]);
    noStore(res);
    const parsed = z.object({ input: plainText(3, 200), sessionToken: z.string().uuid() }).strict().safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "A valid address search is required");
    const response = await providerFetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": requiredEnv("GOOGLE_MAPS_SERVER_KEY") },
      body: JSON.stringify({
        input: parsed.data.input,
        sessionToken: parsed.data.sessionToken,
        includedRegionCodes: ["ph"],
        languageCode: "en",
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new ApiError(502, "Address search is temporarily unavailable", data);
    return res.status(200).json({ suggestions: (data.suggestions ?? []).map((entry: any) => ({
      placeId: entry.placePrediction?.placeId,
      text: entry.placePrediction?.text?.text,
    })).filter((entry: any) => entry.placeId && entry.text) });
  } catch (error) { return handleApiError(res, error); }
}
