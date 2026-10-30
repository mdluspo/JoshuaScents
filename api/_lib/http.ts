import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "node:crypto";

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

const buckets = new Map<string, { count: number; resets: number }>();
const limits: Record<string, number> = { "/api/checkout": 8, "/api/ai/recommend": 8, "/api/media/sign": 10, "/api/places/autocomplete": 45, "/api/places/details": 30, "/api/delivery/quote": 15, "/api/admin/session": 30, "/api/admin/orders": 45 };
export function secureHeaders(res: VercelResponse) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
}

export function rateLimit(req: VercelRequest, res: VercelResponse, route: string, limit = limits[route] ?? 120, now = Date.now()) {
  // Instance-local protection for a prototype. A shared gateway limit is still
  // needed before public launch; serverless instances do not share this map.
  const trustedIp = process.env.VERCEL === "1" ? req.headers["x-forwarded-for"] : req.socket?.remoteAddress;
  const ip = typeof trustedIp === "string" ? trustedIp.split(",")[0].trim() : "unknown";
  const key = crypto.createHash("sha256").update(`${route}:${ip}`).digest("hex");
  if (buckets.size >= 5000) for (const [id, bucket] of buckets) if (bucket.resets <= now) buckets.delete(id);
  let bucket = buckets.get(key);
  if (!bucket || bucket.resets <= now) {
    if (buckets.size >= 5000) throw new ApiError(429, "Too many requests. Please try again shortly.");
    bucket = { count: 0, resets: now + 60_000 }; buckets.set(key, bucket);
  }
  bucket.count++;
  res.setHeader("X-RateLimit-Limit", String(limit));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, limit - bucket.count)));
  if (bucket.count > limit) { res.setHeader("Retry-After", String(Math.max(1, Math.ceil((bucket.resets - now) / 1000)))); throw new ApiError(429, "Too many requests. Please try again shortly."); }
}

export function checkOrigin(req: VercelRequest) {
  if (req.headers["sec-fetch-site"] === "cross-site") throw new ApiError(403, "This request is not allowed.");
  const origin = req.headers.origin;
  // Bearer-token clients and provider webhooks need not send a browser Origin.
  // Origin checks supplement authentication; they do not replace it.
  if (origin === undefined) return;
  if (typeof origin !== "string" || origin === "null") throw new ApiError(403, "This request is not allowed.");
  const allowed = new Set<string>();
  for (const value of [process.env.APP_ORIGIN, process.env.VITE_SITE_URL, process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined]) {
    if (!value) continue;
    try { const url = new URL(value); if (["https:", "http:"].includes(url.protocol)) allowed.add(url.origin); } catch { /* Invalid configuration is not an allowed origin. */ }
  }
  if (process.env.VERCEL !== "1" && typeof req.headers.host === "string") {
    try { const url = new URL(`http://${req.headers.host}`); if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) { allowed.add(url.origin); allowed.add(`https://${url.host}`); } } catch { /* Deny malformed hosts. */ }
  }
  if (!allowed.has(origin)) throw new ApiError(403, "This request is not allowed.");
}

export function allowMethods(req: VercelRequest, res: VercelResponse, methods: string[]) {
  secureHeaders(res);
  if (!methods.includes(req.method ?? "")) {
    res.setHeader("Allow", methods.join(", "));
    throw new ApiError(405, "Method not allowed");
  }
  checkOrigin(req);
  const route = (req.url ?? "/api").split("?")[0];
  rateLimit(req, res, route);
  if (!["GET", "HEAD"].includes(req.method ?? "")) {
    if (!/^application\/json(?:\s*;|$)/i.test(String(req.headers["content-type"] ?? ""))) throw new ApiError(415, "Send this request as application/json.");
    const length = Number(req.headers["content-length"] ?? 0);
    if (!Number.isFinite(length) || length < 0 || length > 24_576) throw new ApiError(413, "The request is too large.");
    let serialized: string;
    try { serialized = JSON.stringify(req.body); } catch { throw new ApiError(400, "Invalid JSON request."); }
    if (typeof serialized !== "string" || req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) throw new ApiError(400, "A JSON object is required.");
    if (Buffer.byteLength(serialized, "utf8") > 24_576) throw new ApiError(413, "The request is too large.");
  }
}

export function noStore(res: VercelResponse) {
  secureHeaders(res);
  res.setHeader("Cache-Control", "no-store, max-age=0");
}

export function handleApiError(res: VercelResponse, error: unknown) {
  const known = error instanceof ApiError;
  const status = known ? error.status : 500;
  const message = known ? error.message : "An unexpected server error occurred";
  const requestId = crypto.randomUUID();
  if (status >= 500) console.error("API request failed", { requestId, status, type: known ? "ApiError" : "UnexpectedError" });
  secureHeaders(res);
  res.setHeader("Cache-Control", "no-store, max-age=0");
  return res.status(status).json({ error: message, requestId });
}

export function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new ApiError(503, "This feature is not configured yet.");
  return value;
}

export async function providerFetch(input: Parameters<typeof fetch>[0], init: RequestInit = {}) {
  try { return await fetch(input, { ...init, redirect: "error", signal: AbortSignal.timeout(8000) }); }
  catch (error) { throw new ApiError(error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name) ? 504 : 502, "The connected service is temporarily unavailable. Please try again."); }
}

export function requireCheckoutEnabled(payment = false) {
  if (process.env.STORE_CHECKOUT_ENABLED !== "true" || (payment && process.env.STORE_PAYMENTS_ENABLED !== "true")) throw new ApiError(503, "Checkout is preview-only. No order or payment has been created.");
}
