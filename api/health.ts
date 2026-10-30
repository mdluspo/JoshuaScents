import type { VercelRequest, VercelResponse } from "@vercel/node";
import { allowMethods, handleApiError, noStore } from "./_lib/http.js";
import { requireAdmin } from "./_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    allowMethods(req, res, ["GET"]);
    noStore(res);
    if (!req.headers.authorization) return res.status(200).json({ ok: true, mode: process.env.STORE_CHECKOUT_ENABLED === "true" ? "store" : "prototype" });
    await requireAdmin(req.headers.authorization);
    const present = (names: string[]) => names.every((name) => Boolean(process.env[name]?.trim()));
    return res.status(200).json({
      ok: true,
      integrations: {
        supabase: present(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]),
        paymongo: present(["PAYMONGO_SECRET_KEY", "PAYMONGO_WEBHOOK_SECRET"]),
        resend: present(["RESEND_API_KEY", "EMAIL_FROM"]),
        googlePlaces: present(["GOOGLE_MAPS_SERVER_KEY"]),
        lalamove: present(["LALAMOVE_API_KEY", "LALAMOVE_API_SECRET", "STORE_LAT", "STORE_LNG"]),
        cloudinary: present(["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]),
        openai: present(["OPENAI_API_KEY"]),
        googleAnalytics: present(["VITE_GA_MEASUREMENT_ID", "GA_API_SECRET"]),
        metaConversions: present(["META_DATASET_ID", "META_CONVERSIONS_TOKEN"]),
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
