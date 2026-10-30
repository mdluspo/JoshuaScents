import { getSupabase } from "./supabase";

export class StoreApiError extends Error {
  constructor(message: string, public status: number, public details?: unknown) { super(message); }
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  const token = (await getSupabase()?.auth.getSession())?.data.session?.access_token;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
    redirect: "error",
  });
  if (!response.headers.get("content-type")?.includes("application/json")) throw new StoreApiError("This feature is unavailable in the frontend-only preview. Please try again when the API server is available.", 503);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new StoreApiError(data.error || "The request failed", response.status, data.details);
  return data as T;
}

export type CheckoutInput = {
  customer: { name: string; email: string; phone: string; address: string; city: string; zip: string; latitude?: number; longitude?: number };
  paymentMethod: "paymongo" | "cod";
  deliveryQuoteId?: string;
  shippingCentavos: number;
  items: Array<{ productId: number; size: string; quantity: number }>;
};

export type CheckoutResult = { orderId: string; reference: string; status: string; checkoutUrl?: string };
export const createCheckout = (input: CheckoutInput) => request<CheckoutResult>("/api/checkout", input);

export type AddressSuggestion = { placeId: string; text: string };
export const searchAddresses = (input: string, sessionToken: string) =>
  request<{ suggestions: AddressSuggestion[] }>("/api/places/autocomplete", { input, sessionToken });
export const getAddressDetails = (placeId: string, sessionToken: string) =>
  request<{ address: string; city: string; zip: string; latitude: number; longitude: number }>("/api/places/details", { placeId, sessionToken });

export const getDeliveryQuote = (input: { address: string; latitude: number; longitude: number }) =>
  request<{ quotationId: string; expiresAt: string; amountCentavos: number; currency: string }>("/api/delivery/quote", input);

export const findScentRecommendations = (preference: string) => request<{ recommendations: Array<{ productId: number; reason: string }> }>("/api/ai/recommend", { preference });

export async function uploadProductImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size <= 0 || file.size > 5 * 1024 * 1024) throw new StoreApiError("Choose a JPEG, PNG or WebP image no larger than 5 MB.", 400);
  const token = (await getSupabase()?.auth.getSession())?.data.session?.access_token;
  if (!token) throw new StoreApiError("Administrator sign-in is required", 401);
  const signResponse = await fetch("/api/media/sign", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: "{}" });
  const signed = await signResponse.json() as { cloudName: string; apiKey: string; folder: string; timestamp: number; signature: string; error?: string };
  if (!signResponse.ok) throw new StoreApiError(signed.error || "Image signing failed", signResponse.status);
  const form = new FormData();
  form.set("file", file); form.set("api_key", signed.apiKey); form.set("folder", signed.folder);
  form.set("timestamp", String(signed.timestamp)); form.set("signature", signed.signature);
  const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, { method: "POST", body: form });
  const data = await uploadResponse.json();
  if (!uploadResponse.ok) throw new StoreApiError(data.error?.message || "Image upload failed", uploadResponse.status);
  return data as { public_id: string; secure_url: string };
}
