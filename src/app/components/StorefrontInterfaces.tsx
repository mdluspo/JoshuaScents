import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, Leaf, Minus, Package, Plus, ShoppingBag, ShieldCheck, Truck, X } from "lucide-react";
import { FavoriteButton } from "./FavoriteButton";
import { AddressAutocomplete } from "./AddressAutocomplete";

export interface StoreProduct {
  id: number; name: string; brand: string; family: string; category: string;
  notes: string; price: number; sizes: { label: string; price: number }[];
  description: string; img: string; bestSeller: boolean;
}
export interface BagItem { product: StoreProduct; size: string; price: number; qty: number }
type AddToBag = (product: StoreProduct, size: string, price: number, quantity?: number) => void;
export const StoreActions = createContext<{ add: AddToBag; openBag: () => void } | null>(null);
const money = (value: number) => `PHP ${value.toLocaleString("en-PH", { maximumFractionDigits: 2 })}`;
const tidy = (value: string) => value.replaceAll("â€¢", "·").replaceAll("•", "·").replaceAll("â€”", "—").replaceAll("HermÃ¨s", "Hermès");

function Quantity({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  return <div className="atelier-quantity" role="group" aria-label={`${label} quantity`}>
    <button type="button" aria-label={`Decrease ${label} quantity`} disabled={value <= 1} onClick={() => onChange(value - 1)}><Minus size={13} /></button>
    <output aria-live="polite">{value}</output>
    <button type="button" aria-label={`Increase ${label} quantity`} disabled={value >= 99} onClick={() => onChange(value + 1)}><Plus size={13} /></button>
  </div>;
}

function SizeChoices({ product, value, onChange }: { product: StoreProduct; value: string; onChange: (size: { label: string; price: number }) => void }) {
  return <div className="atelier-sizes" role="group" aria-label={`${product.name} decant size`}>
    {product.sizes.map(size => <button type="button" key={size.label} aria-pressed={value === size.label} onClick={() => onChange(size)}>{size.label}</button>)}
  </div>;
}

export function ShopProductCard({ product, onOpen, horizontal = false, rank, preferredSize = "" }: { product: StoreProduct; onOpen: () => void; horizontal?: boolean; rank?: number; preferredSize?: string }) {
  const actions = useContext(StoreActions);
  const [size, setSize] = useState(product.sizes.find(size => size.label === preferredSize) ?? product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  useEffect(() => { if (!added) return; const timer = window.setTimeout(() => setAdded(false), 2000); return () => clearTimeout(timer); }, [added]);
  return <article className={`atelier-card ${horizontal ? "atelier-card--horizontal" : ""}`}>
    <div className="atelier-card-visual">
      <button type="button" className="atelier-card-image" onClick={onOpen} aria-label={`View ${product.name}`}><img loading="lazy" src={product.img} alt={`${product.name} decant`} /></button>
      {product.bestSeller && <span className="atelier-badge">{rank ? `No. ${String(rank).padStart(2, "0")}` : "Bestseller"}</span>}
      <FavoriteButton productId={product.id} className="atelier-favorite" />
    </div>
    <div className="atelier-card-info">
      <button type="button" className="atelier-card-name" onClick={onOpen}>{tidy(product.name)}</button>
      <p className="atelier-card-caption">{product.family} · Fragrance decant</p>
      <SizeChoices product={product} value={size.label} onChange={setSize} />
      <div className="atelier-card-purchase"><strong>{money(size.price * quantity)}</strong><Quantity value={quantity} onChange={setQuantity} label={product.name} /></div>
      <button type="button" className="atelier-primary" onClick={() => { actions?.add(product, size.label, size.price, quantity); setAdded(true); }}>
        {added ? <Check size={15} /> : <ShoppingBag size={15} />}<span aria-live="polite">{added ? "Added to bag" : "Add to bag"}</span>
      </button>
    </div>
  </article>;
}

export function ProductDetail({ product, related, onOpen, onBack, addToBag, openBag }: { product: StoreProduct; related: StoreProduct[]; onOpen: (p: StoreProduct) => void; onBack: () => void; addToBag: AddToBag; openBag: () => void }) {
  const actions = useContext(StoreActions);
  const [size, setSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [view, setView] = useState(0);
  const [added, setAdded] = useState(false);
  useEffect(() => { setSize(product.sizes[0]); setQuantity(1); setView(0); setAdded(false); }, [product.id]);
  useEffect(() => { if (!added) return; const timer = window.setTimeout(() => setAdded(false), 2500); return () => clearTimeout(timer); }, [added]);
  const accords = tidy(product.notes).split("·").map(note => note.trim()).filter(Boolean);
  return <div className="atelier-page"><div className="atelier-shell">
    <button className="atelier-back" onClick={onBack}><ArrowLeft size={14} /> The collection</button>
    <div className="atelier-detail">
      <div className="atelier-gallery">
        <div className={`atelier-gallery-stage ${view === 1 ? "is-detail" : ""}`}>
          <img key={`${product.id}-${view}`} src={product.img} alt={`${product.name} decant — ${view ? "glass detail" : "full view"}`} />
          <button className="atelier-gallery-arrow is-left" aria-label="Previous product view" onClick={() => setView(view ? 0 : 1)}><ChevronLeft size={19} /></button>
          <button className="atelier-gallery-arrow is-right" aria-label="Next product view" onClick={() => setView(view ? 0 : 1)}><ChevronRight size={19} /></button>
          <span className="atelier-gallery-caption">DECANTS BY JOSHUA · {view ? "THE DETAILS" : "THE DECANT"}</span>
        </div>
        <div className="atelier-thumbnails" aria-label="Product gallery">
          {["Full view", "Glass detail"].map((label, index) => <button key={label} aria-pressed={view === index} onClick={() => setView(index)}><span className={index ? "is-detail" : ""}><img src={product.img} alt="" /></span><small>{label}</small></button>)}
        </div>
      </div>
      <div className="atelier-detail-info">
        <p className="atelier-eyebrow">THE FRAGRANCE COLLECTION</p>
        <h1>{tidy(product.name)}</h1>
        <p className="atelier-detail-subtitle">Fragrance decant</p>
        <p className="atelier-notes">{tidy(product.notes)}</p>
        <div className="atelier-price-line"><span>{money(size.price)}</span><small>{size.label} decant</small></div>
        <SizeChoices product={product} value={size.label} onChange={setSize} />
        <div className="atelier-detail-quantity"><Quantity value={quantity} onChange={setQuantity} label={product.name} /><span>{quantity > 1 ? `${money(size.price * quantity)} total` : "Find your perfect amount."}</span></div>
        <button className="atelier-primary" onClick={() => { addToBag(product, size.label, size.price, quantity); setAdded(true); }}>{added ? <Check size={17} /> : <ShoppingBag size={17} />}<span aria-live="polite">{added ? "Added to your bag" : "Add to bag"}</span></button>
        {added && <button className="atelier-text-link" onClick={actions?.openBag ?? openBag}>View your bag <ArrowRight size={14} /></button>}
        <FavoriteButton productId={product.id} className="atelier-wishlist" showLabel />
        <div className="atelier-accords"><p>Fragrance accords</p><div>{accords.map((note, i) => <span key={note} data-tone={i % 3}>{note}</span>)}</div></div>
        <div className="atelier-accordions">
          <details open><summary><Leaf size={17} /> Scent profile <ChevronDown size={15} /></summary><p>{tidy(product.description)}</p></details>
          <details><summary><Package size={17} /> The decant <ChevronDown size={15} /></summary><p>A {size.label} portion of your selected fragrance. Product imagery illustrates the decant container, not the original retail bottle.</p></details>
          <details><summary><Truck size={17} /> Delivery & care <ChevronDown size={15} /></summary><p>Delivery availability and charges are confirmed during checkout. Keep your decant upright, away from direct sunlight and heat.</p></details>
        </div>
      </div>
    </div>
    {!!related.length && <ProductCarousel products={related} onOpen={onOpen} onExplore={onBack} />}
  </div></div>;
}

function ProductCarousel({ products, onOpen, onExplore }: { products: StoreProduct[]; onOpen: (p: StoreProduct) => void; onExplore: () => void }) {
  const rail = useRef<HTMLDivElement>(null);
  const [canBack, setCanBack] = useState(false);
  const [canForward, setCanForward] = useState(false);
  useEffect(() => {
    const node = rail.current;
    if (!node) return;
    const update = () => { setCanBack(node.scrollLeft > 1); setCanForward(node.scrollLeft + node.clientWidth < node.scrollWidth - 2); };
    const resize = new ResizeObserver(update);
    resize.observe(node);
    node.addEventListener("scroll", update, { passive: true });
    update();
    return () => { resize.disconnect(); node.removeEventListener("scroll", update); };
  }, [products]);
  const move = (direction: number) => {
    const node = rail.current;
    if (node) node.scrollBy({ left: direction * node.clientWidth * .8, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  return <section className="atelier-related"><div className="atelier-section-heading"><div><p className="atelier-eyebrow">CONTINUE THE DISCOVERY</p><h2>You may also love</h2></div><button className="atelier-text-link" onClick={onExplore}>Explore all <ArrowRight size={15} /></button></div><div className="atelier-carousel"><button className="atelier-carousel-arrow" aria-label="Previous fragrances" disabled={!canBack} onClick={() => move(-1)}><ChevronLeft size={20} /></button><div className="atelier-carousel-rail" ref={rail} tabIndex={0} aria-label="Related fragrances">{products.map(item => <ShopProductCard key={item.id} product={item} horizontal onOpen={() => onOpen(item)} />)}</div><button className="atelier-carousel-arrow" aria-label="Next fragrances" disabled={!canForward} onClick={() => move(1)}><ChevronRight size={20} /></button></div></section>;
}

type BagProps = { items: BagItem[]; updateQty: (id: number, size: string, qty: number) => void; removeItem: (id: number, size: string) => void; onShop: () => void; onCheckout: () => void };
function BagContents({ items, updateQty, removeItem, onShop, onCheckout }: BagProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return <>
    {!items.length ? <div className="atelier-empty"><ShoppingBag size={44} strokeWidth={1} /><h2>Your next discovery awaits.</h2><p>A little space for something memorable.</p><button className="atelier-primary" onClick={onShop}>Explore the collection <ArrowRight size={16} /></button></div> : <>
      <div className="atelier-bag-items">{items.map(item => <article className="atelier-bag-item" key={`${item.product.id}-${item.size}`}>
        <div className="atelier-bag-image"><img src={item.product.img} alt={`${item.product.name} decant`} /></div>
        <div className="atelier-bag-item-info"><h3>{tidy(item.product.name)}</h3><p>{item.size} decant</p><strong>{money(item.price * item.qty)}</strong><div className="atelier-bag-controls"><Quantity label={`${item.product.name} ${item.size}`} value={item.qty} onChange={qty => updateQty(item.product.id, item.size, qty)} /><button className="atelier-text-link" onClick={() => removeItem(item.product.id, item.size)}>Remove</button></div></div>
      </article>)}</div>
      <div className="atelier-bag-totals"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><p>Delivery calculated at checkout.</p><button className="atelier-primary" onClick={onCheckout}>Checkout <ArrowRight size={17} /></button><button className="atelier-text-link" onClick={onShop}>Continue shopping</button></div>
    </>}
    <div className="atelier-bag-signature"><Leaf size={30} strokeWidth={1} /><p>SMALLER BOTTLES.<br />MORE POSSIBILITIES.</p><span /></div>
  </>;
}

export function BagDrawer({ open, onClose, ...props }: BagProps & { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!open) { if (dialog.open) dialog.close(); return; }
    const active = document.activeElement as HTMLElement | null;
    dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; if (dialog.open) dialog.close(); active?.focus(); };
  }, [open]);
  return <dialog ref={ref} className="atelier-bag-dialog" aria-labelledby="atelier-bag-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}><div className="atelier-bag-sheet"><div className="atelier-bag-heading"><h2 id="atelier-bag-title">Your bag <small>{props.items.reduce((sum, item) => sum + item.qty, 0)}</small></h2><button aria-label="Close bag" onClick={onClose}><X size={21} strokeWidth={1} /></button></div><BagContents {...props} /></div></dialog>;
}

export function BagPage(props: BagProps) {
  return <div className="atelier-page"><div className="atelier-shell atelier-bag-page"><button className="atelier-back" onClick={props.onShop}><ArrowLeft size={14} /> The collection</button><div className="atelier-bag-page-panel"><p className="atelier-eyebrow">YOUR PERSONAL SELECTION</p><h1>Your bag</h1><BagContents {...props} /></div></div></div>;
}

export type CheckoutForm = { name: string; email: string; phone: string; address: string; city: string; zip: string; payment: string };
type CheckoutProps = {
  items: BagItem[]; form: CheckoutForm; onField: (name: keyof CheckoutForm, value: string) => void;
  onAddress: (address: { address: string; city: string; zip: string; latitude: number; longitude: number }) => void;
  step: 1 | 2 | 3; onStep: (step: 1 | 2 | 3) => void; onContinue: () => void;
  onPlace: () => void; onBack: () => void; onShop: () => void; placing: boolean; error: string;
  shipping: number; quoteRequired: boolean; prototype?: boolean;
};

function CheckoutField({ label, name, value, onChange, type = "text", autoComplete }: { label: string; name: string; value: string; onChange: (value: string) => void; type?: string; autoComplete?: string }) {
  return <label className="atelier-field" htmlFor={`checkout-${name}`}><span>{label}</span><input id={`checkout-${name}`} name={name} type={type} autoComplete={autoComplete} required value={value} onChange={event => onChange(event.target.value)} /></label>;
}

function CheckoutSection({ number, title, children, open = true }: { number: number; title: string; children: ReactNode; open?: boolean }) {
  return <details className="atelier-checkout-section" open={open}><summary><span className="atelier-step-number">{number}</span><h2>{title}</h2><ChevronDown size={17} /></summary><div className="atelier-checkout-section-body">{children}</div></details>;
}

export function CheckoutInterface({ items, form, onField, onAddress, step, onStep, onContinue, onPlace, onBack, onShop, placing, error, shipping, quoteRequired, prototype = true }: CheckoutProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const paymentRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (step > 1) paymentRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [step]);
  if (!items.length) return <div className="atelier-page"><div className="atelier-shell"><div className="atelier-empty"><ShoppingBag size={44} /><h1>Your bag is empty.</h1><p>Choose your fragrances before checking out.</p><button className="atelier-primary" onClick={onShop}>Explore fragrances <ArrowRight size={17} /></button></div></div></div>;
  return <div className="atelier-page"><div className="atelier-shell"><button className="atelier-back" onClick={onBack}><ArrowLeft size={14} /> Back to bag</button><div className="atelier-checkout-heading"><p className="atelier-eyebrow">THE FINAL DETAILS</p><h1>Make them yours.</h1><span><ShieldCheck size={15} /> {prototype ? "Prototype · no real orders" : "Secure checkout"}</span></div>
    {prototype && <p className="atelier-prototype-notice" role="status">Checkout preview only. No payment details are collected, no order is saved, and no payment will be taken. Please use sample details while testing.</p>}
    <div className="atelier-checkout-grid"><div className="atelier-checkout-form">
      <CheckoutSection number={1} title="Contact information"><div className="atelier-fields"><CheckoutField label="Email address" name="email" type="email" autoComplete="email" value={form.email} onChange={value => onField("email", value)} /><CheckoutField label="Phone number" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={value => onField("phone", value)} /></div><p className="atelier-caption">Your contact details are used for order and delivery updates.</p></CheckoutSection>
      <CheckoutSection number={2} title="Delivery address"><div className="atelier-fields"><div className="atelier-field-full"><CheckoutField label="Full name" name="name" autoComplete="name" value={form.name} onChange={value => onField("name", value)} /></div><div className="atelier-field-full atelier-address"><AddressAutocomplete manualOnly={prototype} value={form.address} onChange={value => onField("address", value)} onSelect={onAddress} /></div><CheckoutField label="City" name="city" autoComplete="address-level2" value={form.city} onChange={value => onField("city", value)} /><CheckoutField label="ZIP / Postal code" name="zip" autoComplete="postal-code" value={form.zip} onChange={value => onField("zip", value)} /></div><p className="atelier-caption">Country / Region: Philippines</p></CheckoutSection>
      <CheckoutSection number={3} title="Delivery"><div className="atelier-delivery"><Truck size={21} strokeWidth={1.3} /><div><strong>Delivery to your address</strong><p>{prototype ? "Delivery is not booked or quoted in this preview." : step === 1 ? "Confirm your details to calculate delivery." : shipping > 0 ? "Delivery quote confirmed for your selected address." : "No delivery charge for this checkout."}</p></div><span>{prototype ? "Preview" : step === 1 && quoteRequired ? "Calculated next" : step === 1 ? "At checkout" : money(shipping)}</span></div><button className="atelier-primary" disabled={placing} onClick={onContinue}>{placing ? "Confirming delivery…" : step > 1 ? "Update delivery details" : prototype ? "Review preview details" : "Continue to payment"}<ArrowRight size={16} /></button></CheckoutSection>
      <div ref={paymentRef}><CheckoutSection number={4} title={prototype ? "Preview review" : "Payment"} open={step > 1}>{prototype ? <div className="atelier-secure-note"><ShieldCheck size={23} strokeWidth={1.2} /><div><strong>No payment is connected.</strong><p>You can explore the checkout layout. Orders and payment methods remain disabled.</p></div></div> : step === 1 ? <div className="atelier-secure-note"><ShieldCheck size={23} strokeWidth={1.2} /><div><strong>Your payment, protected.</strong><p>Confirm delivery details above to choose a payment method.</p></div></div> : <><div className="atelier-payment-options">{[{ value: "paymongo", label: "Secure online payment", detail: "Available cards and e-wallets are shown by PayMongo." }, { value: "cod", label: "Cash on delivery", detail: "Pay when your order arrives." }].map(option => <label key={option.value} className={form.payment === option.value ? "is-selected" : ""}><input type="radio" name="payment" value={option.value} checked={form.payment === option.value} onChange={() => onField("payment", option.value)} /><span><strong>{option.label}</strong><small>{option.detail}</small></span></label>)}</div>{step === 2 && <button className="atelier-primary" onClick={() => onStep(3)}>Review your order <ArrowRight size={16} /></button>}{step === 3 && <div className="atelier-review"><Check size={16} /><p>Ready for {form.name}.<br /><span>{form.address}, {form.city} {form.zip}</span></p><button className="atelier-text-link" onClick={() => onStep(1)}>Edit</button></div>}</> }</CheckoutSection></div>
      {error && <p className="atelier-error" role="alert">{error}</p>}
    </div><aside className="atelier-order-summary"><h2>Order summary</h2><div>{items.map(item => <div className="atelier-summary-item" key={`${item.product.id}-${item.size}`}><div className="atelier-summary-image"><img src={item.product.img} alt={item.product.name} /><span>{item.qty}</span></div><div><h3>{tidy(item.product.name)}</h3><p>{item.size} decant</p><p>Qty: {item.qty}</p></div><strong>{money(item.price * item.qty)}</strong></div>)}</div><dl className="atelier-summary-totals"><div><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div><div><dt>Delivery</dt><dd>{prototype ? "Not calculated" : step === 1 ? "Calculated next" : money(shipping)}</dd></div><div className="atelier-total"><dt>{step === 1 ? "Subtotal" : "Total"}</dt><dd>{money(subtotal + (step === 1 ? 0 : shipping))}</dd></div></dl><button className="atelier-primary" disabled={prototype || placing || step !== 3} onClick={onPlace}>{prototype ? "Orders disabled in prototype" : placing ? "Processing…" : form.payment === "cod" ? "Place order" : "Continue to secure payment"}<ArrowRight size={16} /></button><p className="atelier-summary-note"><ShieldCheck size={14} />{prototype ? "No real orders or charges are created." : step !== 3 ? "Confirm delivery and review payment to continue." : form.payment === "cod" ? "Payment collected on delivery." : "You will complete payment securely with PayMongo."}</p></aside></div>
  </div></div>;
}
