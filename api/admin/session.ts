import type { VercelRequest, VercelResponse } from "@vercel/node";
import { allowMethods, handleApiError, noStore } from "../_lib/http.js";
import { requireAdmin } from "../_lib/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    allowMethods(req, res, ["GET"]);
    noStore(res);
    const user = await requireAdmin(req.headers.authorization);
    return res.status(200).json({ role: "admin", user: { id: user.id, email: user.email } });
  } catch (error) { return handleApiError(res, error); }
}
