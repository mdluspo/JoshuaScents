import { useEffect, useRef, useState } from "react";
import { getAddressDetails, searchAddresses, type AddressSuggestion } from "@/lib/api";

type Address = { address: string; city: string; zip: string; latitude: number; longitude: number };

export function AddressAutocomplete({ value, onChange, onSelect }: { value: string; onChange: (value: string) => void; onSelect: (address: Address) => void }) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const session = useRef(crypto.randomUUID());

  useEffect(() => {
    if (!enabled || value.trim().length < 3) { setSuggestions([]); return; }
    const timer = window.setTimeout(async () => {
      try { setBusy(true); setSuggestions((await searchAddresses(value, session.current)).suggestions); }
      catch { setEnabled(false); setSuggestions([]); }
      finally { setBusy(false); }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [enabled, value]);

  const choose = async (suggestion: AddressSuggestion) => {
    setSuggestions([]); setBusy(true);
    try {
      const details = await getAddressDetails(suggestion.placeId, session.current);
      onChange(details.address); onSelect(details); session.current = crypto.randomUUID();
    } finally { setBusy(false); }
  };

  return (
    <div className="relative md:col-span-2">
      <label className="font-['IBM_Plex_Sans',sans-serif] text-[10px] tracking-[0.16em] text-[rgba(23,23,23,0.5)] uppercase block mb-1.5">Street Address</label>
      <input value={value} placeholder="Start typing your Philippine address" autoComplete="street-address"
        onChange={(event) => { setEnabled(true); onChange(event.target.value); }}
        className="w-full border border-[rgba(0,0,0,0.14)] rounded-lg px-4 py-3 font-['IBM_Plex_Sans',sans-serif] text-[14px] bg-white focus:outline-none focus:border-[#171717] transition-colors" />
      {busy && <span className="absolute right-3 top-9 text-[11px] text-black/40">Searching...</span>}
      {suggestions.length > 0 && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-xl">
          {suggestions.map((suggestion) => <button type="button" key={suggestion.placeId} onClick={() => void choose(suggestion)}
            className="block w-full border-b border-black/5 px-4 py-3 text-left text-[13px] hover:bg-[#f7f5f1] last:border-0">{suggestion.text}</button>)}
        </div>
      )}
      {!enabled && <p className="mt-1 text-[11px] text-black/45">Address suggestions are unavailable; you can still enter the address manually.</p>}
    </div>
  );
}
