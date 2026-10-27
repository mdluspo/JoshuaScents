import crypto from "node:crypto";
import { ApiError, requiredEnv } from "./http.js";

export async function createPayMongoCheckout(input: {
  reference: string;
  customer: { name: string; email: string; phone: string };
  items: Array<{ productName: string; size: string; unitPrice: number; quantity: number }>;
  successUrl: string;
  cancelUrl: string;
}) {
  const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${requiredEnv("PAYMONGO_SECRET_KEY")}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: { attributes: {
      billing: { name: input.customer.name, email: input.customer.email, phone: input.customer.phone },
      cancel_url: input.cancelUrl,
      success_url: input.successUrl,
      description: `Decants by Joshua order ${input.reference}`,
      reference_number: input.reference,
      send_email_receipt: false,
      show_description: true,
      show_line_items: true,
      payment_method_types: ["gcash", "paymaya", "card", "grab_pay"],
      line_items: input.items.map((item) => ({
        amount: item.unitPrice,
        currency: "PHP",
        description: item.size,
        name: item.productName,
        quantity: item.quantity,
      })),
    } } }),
  });
  const body = await response.json();
  if (!response.ok) throw new ApiError(502, "PayMongo could not start the payment", body);
  return { id: body.data.id as string, url: body.data.attributes.checkout_url as string };
}

export function verifyPayMongoSignature(rawBody: string, header: string | undefined) {
  const secret = requiredEnv("PAYMONGO_WEBHOOK_SECRET");
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((part) => part.trim().split("=", 2)));
  const timestamp = parts.t;
  const provided = process.env.PAYMONGO_SECRET_KEY?.startsWith("sk_live_") ? parts.li : parts.te;
  if (!timestamp || !provided) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  return provided.length === expected.length && crypto.timingSafeEqual(
    new Uint8Array(Buffer.from(provided)),
    new Uint8Array(Buffer.from(expected)),
  );
}
