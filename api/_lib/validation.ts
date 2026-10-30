import { z } from "zod";

// Names and addresses are plain text, not rich HTML. Apostrophes and Unicode
// remain valid data; SQL safety comes from bound Supabase queries, not escaping.
export const plainText = (minimum: number, maximum: number) => z.string().trim().min(minimum).max(maximum).refine(value => !/[<>\u0000-\u001f\u007f]/.test(value), "Use plain text without markup or control characters.");
export const latitude = z.number().finite().min(-90).max(90);
export const longitude = z.number().finite().min(-180).max(180);
export const phoneNumber = z.string().trim().min(7).max(30).regex(/^[+\d\s().-]+$/);
export const emailAddress = z.string().trim().email().max(200);
export const httpsUrl = z.string().url().max(500).refine(value => { try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; } });
