export function safeDisplayUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 500 || /[\u0000-\u0020<>]/.test(value)) return null;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : null; } catch { return null; }
}
