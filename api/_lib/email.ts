import { ApiError, requiredEnv } from "./http.js";

const money = (centavos: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(centavos / 100);

export async function sendOrderEmail(order: any) {
  const apiKey = requiredEnv("RESEND_API_KEY");
  const reference = String(order.reference);
  const status = order.status === "paid" ? "Payment received" : "Order received";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: requiredEnv("EMAIL_FROM"),
      to: [order.customer_email],
      bcc: process.env.STORE_NOTIFICATION_EMAIL ? [process.env.STORE_NOTIFICATION_EMAIL] : undefined,
      subject: `${status} - ${reference}`,
      html: `<div style="font-family:Arial,sans-serif;color:#171717"><h1>${status}</h1><p>Hello ${escapeHtml(order.customer_name)},</p><p>Your Decants by Joshua order <strong>${escapeHtml(reference)}</strong> has been recorded.</p><p>Total: <strong>${money(Number(order.total_centavos))}</strong></p><p>We will email you again when your order is dispatched.</p></div>`,
    }),
  });
  if (!response.ok) throw new ApiError(502, "Order saved, but confirmation email failed", await response.text());
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]!);
}
