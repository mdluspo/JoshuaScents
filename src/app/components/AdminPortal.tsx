import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, LockKeyhole, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { getSupabase } from "../../lib/supabase";
import { safeDisplayUrl } from "../../lib/safe-display-url";

type Order = { id: string; reference: string; status: string; payment_method: string; total_centavos: number; customer_name: string; created_at: string; tracking_url: string | null };
type Access = "checking" | "login" | "admin" | "denied" | "unavailable";
const nextSteps = (order: Order) => order.status === "pending_payment" ? ["cancelled"] : order.status === "paid" ? ["processing"] : order.status === "processing" ? ["shipped", ...(order.payment_method === "cod" ? ["cancelled"] : [])] : order.status === "shipped" ? ["delivered"] : [];
const label = (value: string) => value.replaceAll("_", " ");

export function AdminPortal() {
  const supabase = getSupabase();
  const [access, setAccess] = useState<Access>(supabase ? "checking" : "unavailable");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [identity, setIdentity] = useState("");
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState(false);
  const sequence = useRef(0);

  async function api(path: string, method = "GET", body?: unknown) {
    const token = (await supabase?.auth.getSession())?.data.session?.access_token;
    if (!token) throw new Error("Your session has expired. Sign in again.");
    const response = await fetch(path, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(12000), redirect: "error", cache: "no-store" });
    if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("The admin API is not available in the frontend-only preview. Run the API server to test authorized access.");
    const data = await response.json();
    if (response.status === 401 || response.status === 403) { setOrders([]); setAccess(response.status === 403 ? "denied" : "login"); }
    if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "This operation is not available.");
    return data;
  }
  async function verify() {
    const current = ++sequence.current;
    setOrders([]); setMessage(""); setAccess("checking");
    try {
      const session = (await supabase?.auth.getSession())?.data.session;
      if (current !== sequence.current) return;
      if (!session) { setAccess("login"); return; }
      const result = await api("/api/admin/session");
      if (current !== sequence.current) return;
      if (result.role !== "admin") { setAccess("denied"); return; }
      setIdentity(result.user?.email ?? "Administrator"); setAccess("admin");
      const data = await api("/api/admin/orders");
      if (current === sequence.current) setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (error) { if (current === sequence.current) { setMessage(error instanceof Error ? error.message : "Access could not be verified."); setAccess(currentAccess => ["denied", "login"].includes(currentAccess) ? currentAccess : "unavailable"); } }
  }
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void verify();
    const { data } = supabase.auth.onAuthStateChange(() => { window.setTimeout(() => { if (active) void verify(); }, 0); });
    return () => { active = false; sequence.current++; data.subscription.unsubscribe(); };
  }, [supabase]);
  const signIn = async (event: FormEvent) => {
    event.preventDefault(); if (!supabase || busy) return;
    setBusy(true); setMessage("");
    try { const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); if (error) throw new Error("Sign-in failed. Check your credentials or contact the store owner."); await verify(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Sign-in could not be completed."); }
    finally { setPassword(""); setBusy(false); }
  };
  const signOut = async () => { sequence.current++; setOrders([]); setIdentity(""); setAccess("login"); setMessage(""); await supabase?.auth.signOut(); };
  const updateStatus = async (order: Order, status: string) => {
    if (busy || !status) return;
    setBusy(true); setMessage("");
    const current = sequence.current;
    try { const result = await api("/api/admin/orders", "PATCH", { orderId: order.id, status }); if (current === sequence.current) { setOrders(items => items.map(item => item.id === result.order.id ? { ...item, status: result.order.status } : item)); setMessage("Order fulfillment status updated."); } }
    catch (error) { setMessage(error instanceof Error ? error.message : "The status could not be updated."); }
    finally { setBusy(false); }
  };
  return <div className="admin-portal"><header className="admin-topbar"><a href="/">DECANTS BY JOSHUA</a><span><ShieldCheck size={14} /> PRIVATE WORKSPACE</span>{access === "admin" && <button onClick={() => void signOut()}><LogOut size={14} />Sign out</button>}</header><main className={access === "admin" ? "admin-workspace" : "admin-entry"}>
    {access !== "admin" ? <section className="admin-login-card"><LockKeyhole size={28} strokeWidth={1} /><p className="admin-eyebrow">STORE ADMINISTRATION</p><h1>{access === "denied" ? "Access restricted." : "A space for the details."}</h1>
      {access === "checking" ? <p role="status">Verifying your session…</p> : access === "login" ? <><p>Sign in with an administrator account assigned by the store owner. Customer accounts cannot access this workspace.</p><form onSubmit={event => void signIn(event)}><label>Email address<input type="email" autoComplete="username" required maxLength={200} value={email} onChange={event => setEmail(event.target.value)} /></label><label>Password<input type="password" autoComplete="current-password" required maxLength={256} value={password} onChange={event => setPassword(event.target.value)} /></label><button className="admin-primary" disabled={busy} type="submit">{busy ? "Verifying…" : "Sign in"}<ArrowRight size={16} /></button></form></> : access === "denied" ? <><p>This account is not authorized for administration. No store management data has been opened.</p><button className="admin-primary" onClick={() => void signOut()}>Use another account</button></> : <><p>{supabase ? "Admin access could not be verified. No protected data is displayed." : "Authentication is not configured in this prototype yet. There is no demo administrator or password bypass."}</p>{supabase && <button className="admin-primary" onClick={() => void verify()}>Try again</button>}</>}
      {message && <p className="admin-message" role="status">{message}</p>}<a className="admin-return" href="/"><ArrowLeft size={13} />Return to the store</a>
    </section> : <><div className="admin-workspace-heading"><div><p className="admin-eyebrow">FULFILLMENT WORKSPACE</p><h1>Store orders.</h1><p>{identity} · 50 most recent orders</p></div><button className="admin-refresh" disabled={busy} onClick={() => void verify()}><RefreshCw size={15} />Refresh</button></div><p className="admin-prototype-banner">Prototype workspace. Payment processing and financial status changes are not available here.</p>{message && <p className="admin-message" role="status">{message}</p>}
      {!orders.length ? <section className="admin-empty"><h2>No orders to manage.</h2><p>Authorized store orders will appear here when the order system is enabled.</p></section> : <div className="admin-order-list">{orders.map(order => { const tracking = safeDisplayUrl(order.tracking_url); const steps = nextSteps(order); return <article key={order.id}><div><span className="admin-order-reference">{order.reference}</span><h2>{order.customer_name}</h2><p>{new Date(order.created_at).toLocaleDateString("en-PH")} · {order.payment_method.toUpperCase()}</p>{tracking && <a href={tracking} target="_blank" rel="noopener noreferrer">Track delivery</a>}</div><div><strong>PHP {(order.total_centavos / 100).toLocaleString("en-PH")}</strong><span className="admin-status">{label(order.status)}</span></div><label>Next fulfillment step<select aria-label={`Update ${order.reference} status`} value="" disabled={busy || !steps.length} onChange={event => void updateStatus(order, event.target.value)}><option value="">{steps.length ? "Choose next step" : "No further action"}</option>{steps.map(status => <option key={status} value={status}>{label(status)}</option>)}</select></label></article>; })}</div>}</>}
  </main></div>;
}
