import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendOrderEmail } from "../_lib/email.js";
import { ApiError, handleApiError, noStore, requireCheckoutEnabled } from "../_lib/http.js";
import { verifyPayMongoSignature } from "../_lib/paymongo.js";
import { adminDb, updateOrder } from "../_lib/supabase.js";

export const config = { api: { bodyParser: false } };

async function readRaw(req: VercelRequest) {
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  for await (const chunk of req) { const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk); bytes += buffer.length; if (bytes > 65_536) throw new ApiError(413, "The request is too large."); chunks.push(new Uint8Array(buffer)); }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    noStore(res);
    requireCheckoutEnabled(true);
    if (req.method !== "POST") throw new ApiError(405, "Method not allowed");
    const raw = await readRaw(req);
    if (!verifyPayMongoSignature(raw, req.headers["paymongo-signature"] as string | undefined)) throw new ApiError(401, "Invalid webhook signature");
    const event = JSON.parse(raw);
    const eventId = String(event.data?.id ?? "");
    const eventType = String(event.data?.attributes?.type ?? "");
    const providerId = String(event.data?.attributes?.data?.id ?? "");
    if (!eventId || !eventType) throw new ApiError(400, "Malformed webhook event");

    const db = adminDb();
    const { data: seen } = await db.from("integration_events").select("id").eq("id", eventId).maybeSingle();
    if (seen) return res.status(200).json({ received: true, duplicate: true });

    if (eventType.includes("paid") && providerId) {
      const order = await updateOrder(providerId, { status: "paid" });
      if (order) await sendOrderEmail(order);
    }
    await db.from("integration_events").insert({ id: eventId, provider: "paymongo", event_type: eventType, payload: event });
    return res.status(200).json({ received: true });
  } catch (error) {
    return handleApiError(res, error);
  }
}
