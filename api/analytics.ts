import crypto from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { ApiError, allowMethods, handleApiError, noStore } from "./_lib/http.js";

const schema = z.object({
  event: z.enum(["view_item", "add_to_cart", "begin_checkout", "purchase"]),
  clientId: z.string().min(3).max(100),
  eventId: z.string().min(3).max(100),
  url: z.string().url().max(500),
  email: z.string().email().optional(),
  value: z.number().min(0).max(10000000).optional(),
  currency: z.literal("PHP").default("PHP"),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    allowMethods(req, res, ["POST"]);
    noStore(res);
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Invalid analytics event");
    const event = parsed.data;
    const jobs: Promise<Response>[] = [];
    if (process.env.VITE_GA_MEASUREMENT_ID && process.env.GA_API_SECRET) {
      jobs.push(fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(process.env.VITE_GA_MEASUREMENT_ID)}&api_secret=${encodeURIComponent(process.env.GA_API_SECRET)}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: event.clientId, events: [{ name: event.event, params: { value: event.value, currency: event.currency } }] }),
      }));
    }
    if (process.env.META_DATASET_ID && process.env.META_CONVERSIONS_TOKEN) {
      const graphVersion = process.env.META_GRAPH_API_VERSION || "v24.0";
      jobs.push(fetch(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(process.env.META_DATASET_ID)}/events?access_token=${encodeURIComponent(process.env.META_CONVERSIONS_TOKEN)}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [{
          event_name: event.event === "purchase" ? "Purchase" : event.event,
          event_time: Math.floor(Date.now() / 1000), event_id: event.eventId,
          action_source: "website", event_source_url: event.url,
          user_data: event.email ? { em: [crypto.createHash("sha256").update(event.email.trim().toLowerCase()).digest("hex")] } : {},
          custom_data: { value: event.value, currency: event.currency },
        }] }),
      }));
    }
    await Promise.all(jobs);
    return res.status(202).json({ accepted: true });
  } catch (error) { return handleApiError(res, error); }
}
