import crypto from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { allowMethods, handleApiError, noStore, requiredEnv } from "../_lib/http.js";
import { requireAdmin } from "../_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    allowMethods(req, res, ["POST"]);
    noStore(res);
    await requireAdmin(req.headers.authorization);
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "joshua-scents/products";
    const signature = crypto.createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${requiredEnv("CLOUDINARY_API_SECRET")}`).digest("hex");
    return res.status(200).json({
      cloudName: requiredEnv("CLOUDINARY_CLOUD_NAME"),
      apiKey: requiredEnv("CLOUDINARY_API_KEY"),
      folder, timestamp, signature,
    });
  } catch (error) { return handleApiError(res, error); }
}
