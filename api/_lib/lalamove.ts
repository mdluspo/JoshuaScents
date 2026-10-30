import crypto from "node:crypto";
import { ApiError, requiredEnv, providerFetch } from "./http.js";

export async function lalamoveRequest(path: string, body: unknown) {
  const key = requiredEnv("LALAMOVE_API_KEY");
  const secret = requiredEnv("LALAMOVE_API_SECRET");
  const timestamp = Date.now().toString();
  const serialized = JSON.stringify(body);
  const signature = crypto.createHmac("sha256", secret).update(`${timestamp}\r\nPOST\r\n${path}\r\n\r\n${serialized}`).digest("hex");
  const hostname = process.env.LALAMOVE_ENV === "production" ? "https://rest.lalamove.com" : "https://rest.sandbox.lalamove.com";
  const response = await providerFetch(`${hostname}${path}`, {
    method: "POST",
    headers: {
      Authorization: `hmac ${key}:${timestamp}:${signature}`,
      "Content-Type": "application/json",
      Market: process.env.LALAMOVE_MARKET || "PH_MNL",
      "Request-ID": crypto.randomUUID(),
    },
    body: serialized,
  });
  const data = await response.json();
  if (!response.ok) throw new ApiError(response.status === 422 ? 400 : 502, "Lalamove could not quote this address", data);
  return data;
}


export async function quoteDelivery(address: string, latitude: number, longitude: number) {
  const data = await lalamoveRequest("/v3/quotations", { data: {
    serviceType: process.env.LALAMOVE_SERVICE_TYPE || "MOTORCYCLE",
    language: "en_PH",
    stops: [
      { coordinates: { lat: requiredEnv("STORE_LAT"), lng: requiredEnv("STORE_LNG") }, address: requiredEnv("STORE_ADDRESS") },
      { coordinates: { lat: String(latitude), lng: String(longitude) }, address },
    ],
    item: { quantity: "1", weight: "LESS_THAN_3KG", categories: ["OTHERS"], handlingInstructions: ["KEEP_UPRIGHT"] },
  } });
  return {
    quotationId: String(data.data?.quotationId ?? ""),
    expiresAt: String(data.data?.expiresAt ?? ""),
    amountCentavos: Math.round(Number(data.data?.priceBreakdown?.total ?? 0) * 100),
    currency: String(data.data?.priceBreakdown?.currency ?? "PHP"),
  };
}
