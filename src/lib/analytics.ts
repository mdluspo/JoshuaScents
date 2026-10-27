const clientKey = "joshua-scents-client-id";

function clientId() {
  let id = localStorage.getItem(clientKey);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(clientKey, id); }
  return id;
}

export function trackStoreEvent(event: "view_item" | "add_to_cart" | "begin_checkout" | "purchase", value?: number, email?: string) {
  const payload = { event, value, email, currency: "PHP", clientId: clientId(), eventId: crypto.randomUUID(), url: window.location.href };
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  } else {
    void fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true });
  }
}
