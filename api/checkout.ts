import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";
import { z } from "zod";
import { priceCart } from "./_lib/catalog.js";
import { sendOrderEmail } from "./_lib/email.js";
import { ApiError, allowMethods, handleApiError, noStore, requiredEnv, requireCheckoutEnabled } from "./_lib/http.js";
import { emailAddress, latitude, longitude, phoneNumber, plainText } from "./_lib/validation.js";
import { quoteDelivery } from "./_lib/lalamove.js";
import { createPayMongoCheckout } from "./_lib/paymongo.js";
import { adminDb, createOrder, getOptionalUser } from "./_lib/supabase.js";

const requestSchema = z.object({
  customer: z.object({
    name: plainText(2, 100),
    email: emailAddress,
    phone: phoneNumber,
    address: plainText(5, 300),
    city: plainText(2, 100),
    zip: plainText(3, 12),
    latitude: latitude.optional(),
    longitude: longitude.optional(),
  }).strict().refine(customer => (customer.latitude === undefined) === (customer.longitude === undefined), "Provide both coordinates or neither."),
  paymentMethod: z.enum(["paymongo", "cod"]),
  deliveryQuoteId: z.string().max(100).optional(),
  shippingCentavos: z.number().int().min(0).max(100000).default(0),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    size: z.string().min(1).max(20),
    quantity: z.number().int().min(1).max(20),
  }).strict()).min(1).max(30),
}).strict();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    allowMethods(req, res, ["POST"]);
    noStore(res);
    requireCheckoutEnabled();
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "Please check your checkout details", parsed.error.flatten());
    const input = parsed.data;
    requireCheckoutEnabled(input.paymentMethod === "paymongo");
    const signedInUser = await getOptionalUser(req.headers.authorization);
    let priced;
    try { priced = priceCart(input.items); }
    catch (error) { throw new ApiError(400, error instanceof Error ? error.message : "Invalid cart"); }

    const subtotal = priced.reduce((sum, item) => sum + item.lineTotal, 0);
    let authoritativeDelivery: { quotationId?: string; amountCentavos: number } = { amountCentavos: 0 };
    if (process.env.LALAMOVE_API_KEY && input.customer.latitude !== undefined && input.customer.longitude !== undefined) {
      authoritativeDelivery = await quoteDelivery(input.customer.address, input.customer.latitude, input.customer.longitude);
    }
    const total = subtotal + authoritativeDelivery.amountCentavos;
    const reference = `JS-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const orderId = await createOrder({
      p_reference: reference,
      p_payment_method: input.paymentMethod,
      p_subtotal_centavos: subtotal,
      p_shipping_centavos: authoritativeDelivery.amountCentavos,
      p_total_centavos: total,
      p_customer_name: input.customer.name,
      p_customer_email: input.customer.email,
      p_customer_phone: input.customer.phone,
      p_address_line: input.customer.address,
      p_city: input.customer.city,
      p_postal_code: input.customer.zip,
      p_latitude: input.customer.latitude ?? null,
      p_longitude: input.customer.longitude ?? null,
      p_delivery_quote_id: authoritativeDelivery.quotationId ?? null,
      p_items: priced.map((item) => ({
        product_id: item.productId, product_name: item.productName, size_label: item.size,
        unit_price_centavos: item.unitPrice, quantity: item.quantity, line_total_centavos: item.lineTotal,
      })),
    });

    if (signedInUser) {
      const { error: ownerError } = await adminDb().from("orders").update({ user_id: signedInUser.id }).eq("id", orderId);
      if (ownerError) throw new ApiError(500, "Order saved, but it could not be linked to your account", ownerError.message);
    }

    if (input.paymentMethod === "cod") {
      const order = { reference, status: "processing", total_centavos: total, customer_name: input.customer.name, customer_email: input.customer.email };
      const { error } = await adminDb().from("orders").update({ status: "processing" }).eq("id", orderId);
      if (error) throw new ApiError(500, "Order saved, but its status could not be updated", error.message);
      await sendOrderEmail(order);
      return res.status(201).json({ orderId, reference, status: "processing" });
    }

    const siteUrl = requiredEnv("VITE_SITE_URL").replace(/\/$/, "");
    const checkout = await createPayMongoCheckout({
      reference,
      customer: input.customer,
      items: priced,
      successUrl: `${siteUrl}/?payment=success&order=${encodeURIComponent(reference)}`,
      cancelUrl: `${siteUrl}/?payment=cancelled`,
    });
    const { error } = await adminDb().from("orders").update({ payment_provider_id: checkout.id }).eq("id", orderId);
    if (error) throw new ApiError(500, "Payment started, but its reference could not be saved", error.message);
    return res.status(201).json({ orderId, reference, status: "pending_payment", checkoutUrl: checkout.url });
  } catch (error) {
    return handleApiError(res, error);
  }
}
