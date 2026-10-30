import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { ApiError, allowMethods, handleApiError, noStore } from "../_lib/http.js";
import { quoteDelivery } from "../_lib/lalamove.js";
import { latitude, longitude, plainText } from "../_lib/validation.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    allowMethods(req, res, ["POST"]);
    noStore(res);
    const parsed = z.object({
      address: plainText(5, 300),
      latitude,
      longitude,
    }).strict().safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Select a suggested delivery address first");
    return res.status(200).json(await quoteDelivery(parsed.data.address, parsed.data.latitude, parsed.data.longitude));
  } catch (error) { return handleApiError(res, error); }
}
