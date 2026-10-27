import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Heart, MapPin, Package, ShieldCheck, UserRound, X } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

type AccountTab = "profile" | "orders" | "addresses" | "favorites" | "admin";

type Profile = {
  full_name: string | null;
  phone: string | null;
  role: "customer" | "admin";
};

type Address = {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  city: string;
  postal_code: string;
  is_default: boolean;
};

type OrderItem = {
  product_name: string;
  size_label: string;
  quantity: number;
  line_total_centavos: number;
};

type StoreOrder = {
  id: string;
  reference: string;
  status: string;
  payment_method: string;
  total_centavos: number;
  customer_name?: string;
  customer_email?: string;
  created_at: string;
  tracking_url: string | null;
  order_items?: OrderItem[];
};

type Favorite = {
  product_id: number;
  products: { id: number; name: string; brand: string; family: string } | null;
};

const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const emptyAddress = {
  label: "Home",
  recipient_name: "",
  phone: "",
  address_line: "",
  city: "",
  postal_code: "",
  is_default: false,
};

const money = (centavos: number) => `PHP ${(centavos / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
const date = (value: string) => new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(value));
const labelStatus = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export function AccountCenterDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const supabase = getSupabase();
  const [tab, setTab] = useState<AccountTab>("profile");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile>({ full_name: "", phone: "", role: "customer" });
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [adminOrders, setAdminOrders] = useState<StoreOrder[]>([]);
  const [addressForm, setAddressForm] = useState(emptyAddress);

  const tabs = useMemo(() => {
    const items: Array<{ id: AccountTab; label: string; icon: typeof UserRound }> = [
      { id: "profile", label: "Profile", icon: UserRound },
      { id: "orders", label: "Orders", icon: Package },
      { id: "addresses", label: "Addresses", icon: MapPin },
      { id: "favorites", label: "Favorites", icon: Heart },
    ];
    if (profile.role === "admin") items.push({ id: "admin", label: "Admin", icon: ShieldCheck });
    return items;
  }, [profile.role]);

  useEffect(() => {
    if (!supabase) {
      const guestEmail = localStorage.getItem("joshua-scents-guest-email");
      setSignedInEmail(guestEmail);
      return;
    }

    let active = true;
    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      const user = data.session?.user;
      setUserId(user?.id ?? null);
      setSignedInEmail(user?.email ?? null);
      if (user) await loadAccount(user.id);
    };
    void syncSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setUserId(user?.id ?? null);
      setSignedInEmail(user?.email ?? null);
      if (user) void loadAccount(user.id);
      else resetAccount();
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (open && userId) void loadAccount(userId);
  }, [open, userId]);

  function resetAccount() {
    setProfile({ full_name: "", phone: "", role: "customer" });
    setOrders([]);
    setAddresses([]);
    setFavorites([]);
    setAdminOrders([]);
    setTab("profile");
  }

  async function loadAccount(id: string) {
    if (!supabase) return;
    setBusy(true);
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, phone, role")
      .eq("id", id)
      .maybeSingle();

    const nextProfile = (profileData as Profile | null) ?? { full_name: "", phone: "", role: "customer" as const };
    setProfile(nextProfile);

    const [ordersResult, addressesResult, favoritesResult] = await Promise.all([
      supabase
        .from("orders")
        .select("id, reference, status, payment_method, total_centavos, created_at, tracking_url, order_items(product_name, size_label, quantity, line_total_centavos)")
        .order("created_at", { ascending: false }),
      supabase.from("addresses").select("*").order("is_default", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("favorites").select("product_id, products(id, name, brand, family)").order("created_at", { ascending: false }),
    ]);

    setOrders((ordersResult.data as StoreOrder[] | null) ?? []);
    setAddresses((addressesResult.data as Address[] | null) ?? []);
    setFavorites((favoritesResult.data as unknown as Favorite[] | null) ?? []);

    if (nextProfile.role === "admin") {
      const { data: allOrders } = await supabase
        .from("orders")
        .select("id, reference, status, payment_method, total_centavos, customer_name, customer_email, created_at, tracking_url")
        .order("created_at", { ascending: false })
        .limit(100);
      setAdminOrders((allOrders as StoreOrder[] | null) ?? []);
    }
    setBusy(false);
  }

  async function sendLink() {
    const normalizedEmail = email.trim();
    if (!normalizedEmail.includes("@")) {
      setMessage("Enter a valid email address.");
      return;
    }
    if (!supabase) {
      localStorage.setItem("joshua-scents-guest-email", normalizedEmail);
      setSignedInEmail(normalizedEmail);
      setMessage("Saved on this device for faster guest checkout.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    setMessage(error ? error.message : "Check your email for the newest secure sign-in link.");
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !userId) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: profile.full_name?.trim() || null, phone: profile.phone?.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", userId);
    setBusy(false);
    setMessage(error ? error.message : "Profile saved.");
  }

  async function addAddress(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !userId) return;
    const required = [addressForm.recipient_name, addressForm.phone, addressForm.address_line, addressForm.city, addressForm.postal_code];
    if (required.some((value) => !value.trim())) {
      setMessage("Complete every address field.");
      return;
    }
    setBusy(true);
    const shouldDefault = addressForm.is_default || addresses.length === 0;
    if (shouldDefault) await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
    const { error } = await supabase.from("addresses").insert({ ...addressForm, is_default: shouldDefault, user_id: userId });
    setBusy(false);
    if (error) setMessage(error.message);
    else {
      setAddressForm(emptyAddress);
      setMessage("Address saved.");
      await loadAccount(userId);
    }
  }

  async function makeDefault(addressId: string) {
    if (!supabase || !userId) return;
    setBusy(true);
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
    const { error } = await supabase.from("addresses").update({ is_default: true, updated_at: new Date().toISOString() }).eq("id", addressId);
    setBusy(false);
    setMessage(error ? error.message : "Default address updated.");
    if (!error) await loadAccount(userId);
  }

  async function removeAddress(addressId: string) {
    if (!supabase || !userId) return;
    setBusy(true);
    const { error } = await supabase.from("addresses").delete().eq("id", addressId);
    setBusy(false);
    setMessage(error ? error.message : "Address removed.");
    if (!error) await loadAccount(userId);
  }

  async function removeFavorite(productId: number) {
    if (!supabase || !userId) return;
    const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("product_id", productId);
    setMessage(error ? error.message : "Removed from favorites.");
    if (!error) setFavorites((current) => current.filter((favorite) => favorite.product_id !== productId));
  }

  async function updateOrderStatus(orderId: string, status: string) {
    if (!supabase || profile.role !== "admin") return;
    const { error } = await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", orderId);
    setMessage(error ? error.message : "Order status updated.");
    if (!error) setAdminOrders((current) => current.map((order) => order.id === orderId ? { ...order, status } : order));
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    else {
      localStorage.removeItem("joshua-scents-guest-email");
      setSignedInEmail(null);
    }
    resetAccount();
    setMessage("");
  }

  if (!open) return null;

  const fieldClass = "w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-black";
  const primaryClass = "rounded-md bg-[#171717] px-5 py-3 text-sm font-semibold tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-3 py-5" onMouseDown={onClose}>
      <div
        className={`flex w-full flex-col overflow-hidden rounded-2xl bg-[#fbf8f1] shadow-2xl ${signedInEmail && supabase ? "h-[720px] max-h-[92vh] max-w-5xl" : "max-h-[92vh] max-w-md"}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4 md:px-7">
          <div>
            <h2 className="font-['Cormorant_Garamond',serif] text-3xl font-bold">Your Account</h2>
            {signedInEmail && <p className="mt-1 text-xs text-black/50">{signedInEmail}</p>}
          </div>
          <button onClick={onClose} aria-label="Close account"><X size={20} /></button>
        </div>

        {!signedInEmail ? (
          <div className="mx-auto w-full max-w-md p-7">
            <p className="mb-4 text-sm text-black/60">
              {supabase ? "Enter your email and we will send a password-free sign-in link." : "Save your email on this device for faster guest checkout. No account or password is created."}
            </p>
            {supabase && <p className="mb-4 text-xs leading-relaxed text-black/45">You only need the email link once on this browser. You will stay signed in securely until you choose Sign out.</p>}
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className={fieldClass} />
            <button onClick={() => void sendLink()} disabled={busy} className={`${primaryClass} mt-4 w-full`}>
              {busy ? "PLEASE WAIT..." : supabase ? "EMAIL ME A SIGN-IN LINK" : "SAVE FOR GUEST CHECKOUT"}
            </button>
            {message && <p className="mt-4 text-sm text-black/60">{message}</p>}
          </div>
        ) : !supabase ? (
          <div className="p-7">
            <p className="text-sm">Guest checkout email: <strong>{signedInEmail}</strong></p>
            <p className="mt-2 text-sm text-black/55">Connect Supabase and sign in to use profiles, saved addresses, favorites, and order history.</p>
            <button className="mt-5 underline" onClick={() => void signOut()}>Clear guest email</button>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 md:grid-cols-[190px_1fr]">
            <nav className="flex gap-1 overflow-x-auto border-b border-black/10 p-3 md:flex-col md:border-b-0 md:border-r md:p-4">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => { setTab(id); setMessage(""); }} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${tab === id ? "bg-[#171717] text-white" : "hover:bg-black/5"}`}>
                  <Icon size={16} />{label}
                </button>
              ))}
              <button onClick={() => void signOut()} className="mt-auto shrink-0 px-3 py-2 text-left text-sm underline">Sign out</button>
            </nav>

            <div className="min-h-0 overflow-y-auto p-5 md:p-7">
              {busy && <p className="mb-3 text-xs font-semibold tracking-widest text-[#9a7d45]">LOADING...</p>}
              {message && <p role="status" className="mb-4 rounded-lg bg-[#eee4d4] px-4 py-3 text-sm">{message}</p>}

              {tab === "profile" && (
                <form onSubmit={(event) => void saveProfile(event)} className="max-w-xl">
                  <p className="text-xs font-semibold tracking-[0.18em] text-[#9a7d45]">PROFILE DETAILS</p>
                  <h3 className="mt-2 font-['Cormorant_Garamond',serif] text-3xl font-bold">Your personal information</h3>
                  <div className="mt-6 space-y-4">
                    <label className="block text-xs font-semibold tracking-wide">FULL NAME<input value={profile.full_name ?? ""} onChange={(event) => setProfile({ ...profile, full_name: event.target.value })} className={`${fieldClass} mt-2`} /></label>
                    <label className="block text-xs font-semibold tracking-wide">PHONE NUMBER<input value={profile.phone ?? ""} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} className={`${fieldClass} mt-2`} /></label>
                    <label className="block text-xs font-semibold tracking-wide">EMAIL<input value={signedInEmail} disabled className={`${fieldClass} mt-2 opacity-60`} /></label>
                  </div>
                  <div className="mt-6 flex items-center gap-4">
                    <button type="submit" disabled={busy} className={primaryClass}>SAVE PROFILE</button>
                    <span className="rounded-full border border-[#9a7d45]/35 px-3 py-1 text-xs font-semibold uppercase text-[#7d6437]">{profile.role}</span>
                  </div>
                </form>
              )}

              {tab === "orders" && (
                <section>
                  <p className="text-xs font-semibold tracking-[0.18em] text-[#9a7d45]">ORDER HISTORY</p>
                  <h3 className="mt-2 font-['Cormorant_Garamond',serif] text-3xl font-bold">Your purchases</h3>
                  {orders.length === 0 ? <p className="mt-6 text-sm text-black/55">No orders are linked to this account yet. New signed-in orders will appear here.</p> : (
                    <div className="mt-6 space-y-4">{orders.map((order) => (
                      <article key={order.id} className="rounded-xl border border-black/10 bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{order.reference}</p><p className="text-xs text-black/45">{date(order.created_at)} · {order.payment_method.toUpperCase()}</p></div><div className="text-right"><p className="font-semibold">{money(order.total_centavos)}</p><p className="text-xs font-semibold text-[#8b6e38]">{labelStatus(order.status)}</p></div></div>
                        {order.order_items?.length ? <div className="mt-3 border-t border-black/8 pt-3 text-sm text-black/60">{order.order_items.map((item, index) => <p key={`${item.product_name}-${index}`}>{item.quantity}× {item.product_name} · {item.size_label}</p>)}</div> : null}
                        {order.tracking_url && <a href={order.tracking_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm underline">Track delivery</a>}
                      </article>
                    ))}</div>
                  )}
                </section>
              )}

              {tab === "addresses" && (
                <section>
                  <p className="text-xs font-semibold tracking-[0.18em] text-[#9a7d45]">SAVED ADDRESSES</p>
                  <h3 className="mt-2 font-['Cormorant_Garamond',serif] text-3xl font-bold">Delivery details</h3>
                  <div className="mt-6 grid gap-4 lg:grid-cols-2">{addresses.map((address) => (
                    <article key={address.id} className="rounded-xl border border-black/10 bg-white p-4">
                      <div className="flex justify-between gap-3"><p className="font-semibold">{address.label}</p>{address.is_default && <span className="text-xs font-semibold text-[#8b6e38]">DEFAULT</span>}</div>
                      <p className="mt-2 text-sm">{address.recipient_name} · {address.phone}</p>
                      <p className="mt-1 text-sm text-black/55">{address.address_line}, {address.city} {address.postal_code}</p>
                      <div className="mt-4 flex gap-4 text-xs underline">{!address.is_default && <button onClick={() => void makeDefault(address.id)}>Make default</button>}<button onClick={() => void removeAddress(address.id)}>Remove</button></div>
                    </article>
                  ))}</div>
                  <form onSubmit={(event) => void addAddress(event)} className="mt-7 rounded-xl border border-black/10 bg-[#f3eadc] p-4">
                    <p className="font-semibold">Add an address</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <input value={addressForm.label} onChange={(event) => setAddressForm({ ...addressForm, label: event.target.value })} placeholder="Label (Home, Work)" className={fieldClass} />
                      <input value={addressForm.recipient_name} onChange={(event) => setAddressForm({ ...addressForm, recipient_name: event.target.value })} placeholder="Recipient name" className={fieldClass} />
                      <input value={addressForm.phone} onChange={(event) => setAddressForm({ ...addressForm, phone: event.target.value })} placeholder="Phone number" className={fieldClass} />
                      <input value={addressForm.address_line} onChange={(event) => setAddressForm({ ...addressForm, address_line: event.target.value })} placeholder="Street and barangay" className={fieldClass} />
                      <input value={addressForm.city} onChange={(event) => setAddressForm({ ...addressForm, city: event.target.value })} placeholder="City" className={fieldClass} />
                      <input value={addressForm.postal_code} onChange={(event) => setAddressForm({ ...addressForm, postal_code: event.target.value })} placeholder="Postal code" className={fieldClass} />
                    </div>
                    <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={addressForm.is_default} onChange={(event) => setAddressForm({ ...addressForm, is_default: event.target.checked })} />Use as default address</label>
                    <button type="submit" disabled={busy} className={`${primaryClass} mt-4`}>SAVE ADDRESS</button>
                  </form>
                </section>
              )}

              {tab === "favorites" && (
                <section>
                  <p className="text-xs font-semibold tracking-[0.18em] text-[#9a7d45]">FAVORITES</p>
                  <h3 className="mt-2 font-['Cormorant_Garamond',serif] text-3xl font-bold">Saved scents</h3>
                  {favorites.length === 0 ? <p className="mt-6 text-sm text-black/55">No favorites yet. Use the heart button on a product page to save a scent.</p> : (
                    <div className="mt-6 grid gap-3 md:grid-cols-2">{favorites.map((favorite) => (
                      <article key={favorite.product_id} className="flex items-center justify-between gap-4 rounded-xl border border-black/10 bg-white p-4">
                        <div><p className="font-['Cormorant_Garamond',serif] text-xl font-semibold">{favorite.products?.name ?? `Product ${favorite.product_id}`}</p><p className="text-xs text-black/50">{favorite.products?.brand} · {favorite.products?.family}</p></div>
                        <button onClick={() => void removeFavorite(favorite.product_id)} className="text-xs underline">Remove</button>
                      </article>
                    ))}</div>
                  )}
                </section>
              )}

              {tab === "admin" && profile.role === "admin" && (
                <section>
                  <p className="text-xs font-semibold tracking-[0.18em] text-[#9a7d45]">ADMIN CONTROLS</p>
                  <div className="mt-2 flex items-end justify-between gap-4"><h3 className="font-['Cormorant_Garamond',serif] text-3xl font-bold">Store orders</h3><p className="text-sm text-black/50">{adminOrders.length} recent orders</p></div>
                  <div className="mt-6 space-y-3">{adminOrders.map((order) => (
                    <article key={order.id} className="grid gap-3 rounded-xl border border-black/10 bg-white p-4 md:grid-cols-[1fr_180px] md:items-center">
                      <div><p className="font-semibold">{order.reference} · {money(order.total_centavos)}</p><p className="text-sm text-black/55">{order.customer_name} · {order.customer_email}</p><p className="text-xs text-black/40">{date(order.created_at)}</p></div>
                      <select value={order.status} onChange={(event) => void updateOrderStatus(order.id, event.target.value)} className={fieldClass}>{ORDER_STATUSES.map((status) => <option key={status} value={status}>{labelStatus(status)}</option>)}</select>
                    </article>
                  ))}</div>
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
