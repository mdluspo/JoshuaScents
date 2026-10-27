import { createClient } from "@supabase/supabase-js";
import { ApiError, requiredEnv } from "./http.js";

export function adminDb() {
  return createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function createOrder(input: Record<string, unknown>) {
  const db = adminDb();
  const { data, error } = await db.rpc("create_store_order", input);
  if (error) throw new ApiError(500, "The order could not be saved", error.message);
  return String(data);
}

export async function updateOrder(providerId: string, values: Record<string, unknown>) {
  const { data, error } = await adminDb().from("orders").update(values).eq("payment_provider_id", providerId).select("*").maybeSingle();
  if (error) throw new ApiError(500, "The order could not be updated", error.message);
  return data;
}

export async function getOptionalUser(authorization: string | undefined) {
  const token = authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await adminDb().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function requireAdmin(authorization: string | undefined) {
  const token = authorization?.replace(/^Bearer\s+/i, "");
  if (!token) throw new ApiError(401, "Sign in as an administrator first");
  const db = adminDb();
  const { data: userData, error: userError } = await db.auth.getUser(token);
  if (userError || !userData.user) throw new ApiError(401, "The session is invalid or expired");
  const { data: profile, error } = await db.from("profiles").select("role").eq("id", userData.user.id).single();
  if (error || profile?.role !== "admin") throw new ApiError(403, "Administrator access is required");
  return userData.user;
}
