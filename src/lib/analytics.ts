const clientKey = "joshua-scents-client-id";

function clientId() {
  let id = localStorage.getItem(clientKey);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(clientKey, id); }
  return id;
}

export function trackStoreEvent(event: "view_item" | "add_to_cart" | "begin_checkout" | "purchase", value?: number, email?: string) {
  // Prototype tracking is opt-in; never forward sign-in URLs or customer email.
  if (import.meta.env.VITE_ENABLE_ANALYTICS !== "true") return;
  let id: string;
  try { id = clientId(); } catch { return; }
  const payload = { event, value, currency: "PHP", clientId: id, eventId: crypto.randomUUID(), url: window.location.origin + window.location.pathname };
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  } else {
    void fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true }).catch(() => {});
  }
}
