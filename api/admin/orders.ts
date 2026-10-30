import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { ApiError, allowMethods, handleApiError, noStore } from "../_lib/http.js";
import { adminDb, requireAdmin } from "../_lib/supabase.js";

const updateSchema = z.object({ orderId: z.string().uuid(), status: z.enum(["processing", "shipped", "delivered", "cancelled"]) }).strict();
export function canTransitionOrder(current: string, next: string, method: string) {
  if (current === "pending_payment") return next === "cancelled";
  if (current === "paid") return next === "processing";
  if (current === "processing") return next === "shipped" || (next === "cancelled" && method === "cod");
  return current === "shipped" && next === "delivered";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    allowMethods(req, res, ["GET", "PATCH"]);
    noStore(res);
    await requireAdmin(req.headers.authorization);
    const db = adminDb();
    if (req.method === "GET") {
      const { data, error } = await db.from("orders").select("id, reference, status, payment_method, total_centavos, customer_name, created_at, tracking_url").order("created_at", { ascending: false }).limit(50);
      if (error) throw new ApiError(503, "Orders are temporarily unavailable.");
      return res.status(200).json({ orders: data ?? [] });
    }
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Choose a valid order and fulfillment status.");
    const { orderId, status } = parsed.data;
    const { data: order, error: readError } = await db.from("orders").select("id, status, payment_method").eq("id", orderId).maybeSingle();
    if (readError) throw new ApiError(503, "The order is temporarily unavailable.");
    if (!order) throw new ApiError(404, "Order not found.");
    if (!canTransitionOrder(order.status, status, order.payment_method)) throw new ApiError(409, "That status change is not allowed. Refresh the order and choose its next fulfillment step.");
    // A conditional update prevents two operators from silently overwriting
    // each other's status changes. Payment/refund states cannot be set here.
    const { data: updated, error } = await db.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", orderId).eq("status", order.status).select("id, status").maybeSingle();
    if (error) throw new ApiError(503, "The order could not be updated.");
    if (!updated) throw new ApiError(409, "This order changed in another session. Refresh before trying again.");
    return res.status(200).json({ order: updated });
  } catch (error) { return handleApiError(res, error); }
}
