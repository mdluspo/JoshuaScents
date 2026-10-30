import { useEffect, useId, useRef, useState } from "react";
import { getAddressDetails, searchAddresses, type AddressSuggestion } from "@/lib/api";

type Address = { address: string; city: string; zip: string; latitude: number; longitude: number };

export function AddressAutocomplete({ value, onChange, onSelect, manualOnly = false }: { value: string; onChange: (value: string) => void; onSelect: (address: Address) => void; manualOnly?: boolean }) {
  const id = useId();
  const remoteEnabled = !manualOnly && import.meta.env.VITE_ENABLE_ADDRESS_SUGGESTIONS === "true";
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const session = useRef(crypto.randomUUID());
  const generation = useRef(0);
  const [message, setMessage] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const sequence = ++generation.current;
    if (!remoteEnabled || !enabled || value.trim().length < 3) { setSuggestions([]); setBusy(false); return; }
    const timer = window.setTimeout(async () => {
      try { setBusy(true); const result = await searchAddresses(value, session.current); if (sequence === generation.current) { setSuggestions(Array.isArray(result.suggestions) ? result.suggestions.filter(item => typeof item.placeId === "string" && typeof item.text === "string").slice(0, 6) : []); setActiveIndex(-1); } }
      catch { if (sequence === generation.current) { setEnabled(false); setSuggestions([]); } }
      finally { if (sequence === generation.current) setBusy(false); }
    }, 400);
    return () => { generation.current++; window.clearTimeout(timer); };
  }, [enabled, remoteEnabled, value]);

  const choose = async (suggestion: AddressSuggestion) => {
    const sequence = ++generation.current;
    setSuggestions([]); setBusy(true);
    try {
      const details = await getAddressDetails(suggestion.placeId, session.current);
      if (sequence !== generation.current) return;
      if (typeof details.address !== "string" || details.address.length > 300 || !Number.isFinite(details.latitude) || Math.abs(details.latitude) > 90 || !Number.isFinite(details.longitude) || Math.abs(details.longitude) > 180) throw new Error("Invalid address response");
      onChange(details.address); onSelect(details); session.current = crypto.randomUUID();
      setEnabled(false); setMessage("");
    } catch { if (sequence === generation.current) setMessage("This address could not be selected. You can enter it manually."); }
    finally { if (sequence === generation.current) setBusy(false); }
  };

  return (
    <div className="relative md:col-span-2">
      <label htmlFor={id} className="font-['IBM_Plex_Sans',sans-serif] text-[10px] tracking-[0.16em] text-[rgba(23,23,23,0.5)] uppercase block mb-1.5">Street Address</label>
      <input id={id} value={value} maxLength={300} placeholder={remoteEnabled ? "Start typing your Philippine address" : "Street address"} autoComplete="street-address" role="combobox" aria-autocomplete="list" aria-expanded={suggestions.length > 0} aria-controls={`${id}-suggestions`} aria-activedescendant={activeIndex >= 0 && suggestions.length ? `${id}-option-${activeIndex}` : undefined}
        onChange={(event) => { setEnabled(true); onChange(event.target.value); }}
        onBlur={() => { generation.current++; setSuggestions([]); setBusy(false); }}
        onKeyDown={event => { if (event.key === "Escape") { setSuggestions([]); setActiveIndex(-1); } if (!suggestions.length) return; if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex(index => (index + 1) % suggestions.length); } if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex(index => (index <= 0 ? suggestions.length : index) - 1); } if (event.key === "Enter" && activeIndex >= 0) { event.preventDefault(); void choose(suggestions[activeIndex]); } }}
        className="w-full border border-[rgba(0,0,0,0.14)] rounded-lg px-4 py-3 font-['IBM_Plex_Sans',sans-serif] text-[14px] bg-white focus:outline-none focus:border-[#171717] transition-colors" />
      {busy && <span className="absolute right-3 top-9 text-[11px] text-black/40">Searching...</span>}
      {suggestions.length > 0 && (
        <div id={`${id}-suggestions`} role="listbox" className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-xl">
          {suggestions.map((suggestion, index) => <button type="button" id={`${id}-option-${index}`} role="option" aria-selected={activeIndex === index} key={suggestion.placeId} onMouseDown={event => event.preventDefault()} onClick={() => void choose(suggestion)}
            className={`block w-full border-b border-black/5 px-4 py-3 text-left text-[13px] hover:bg-[#f7f5f1] last:border-0 ${activeIndex === index ? "bg-[#f0e6d6]" : ""}`}>{suggestion.text}</button>)}
        </div>
      )}
      {message && <p role="status" className="mt-1 text-[11px] text-black/55">{message}</p>}
      {remoteEnabled && !enabled && <p className="mt-1 text-[11px] text-black/45">You can enter or edit the address manually.</p>}
    </div>
  );
}
