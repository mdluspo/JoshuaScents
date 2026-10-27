import type { VercelRequest, VercelResponse } from "@vercel/node";

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export function allowMethods(req: VercelRequest, res: VercelResponse, methods: string[]) {
  if (!methods.includes(req.method ?? "")) {
    res.setHeader("Allow", methods.join(", "));
    throw new ApiError(405, "Method not allowed");
  }
}

export function noStore(res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
}

export function handleApiError(res: VercelResponse, error: unknown) {
  const known = error instanceof ApiError;
  const status = known ? error.status : 500;
  const message = known ? error.message : "An unexpected server error occurred";
  if (!known) console.error(error);
  return res.status(status).json({ error: message, details: known ? error.details : undefined });
}

export function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new ApiError(503, `${name} is not configured`);
  return value;
}
