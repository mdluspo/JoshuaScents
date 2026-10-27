import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { ApiError, allowMethods, handleApiError, noStore } from "../_lib/http.js";
import { quoteDelivery } from "../_lib/lalamove.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    allowMethods(req, res, ["POST"]);
    noStore(res);
    const parsed = z.object({
      address: z.string().min(5).max(300),
      latitude: z.number().finite(),
      longitude: z.number().finite(),
    }).safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Select a suggested delivery address first");
    return res.status(200).json(await quoteDelivery(parsed.data.address, parsed.data.latitude, parsed.data.longitude));
  } catch (error) { return handleApiError(res, error); }
}
