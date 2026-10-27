import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

export function AccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const supabase = getSupabase();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setSignedInEmail(localStorage.getItem("joshua-scents-guest-email"));
      return;
    }
    void supabase.auth.getUser().then(({ data }) => setSignedInEmail(data.user?.email ?? null));
    return supabase.auth.onAuthStateChange((_event, session) => setSignedInEmail(session?.user.email ?? null)).data.subscription.unsubscribe;
  }, [supabase]);

  if (!open) return null;
  const sendLink = async () => {
    if (!email.includes("@")) { setMessage("Enter a valid email address."); return; }
    if (!supabase) {
      localStorage.setItem("joshua-scents-guest-email", email.trim());
      setSignedInEmail(email.trim());
      setMessage("Saved on this device for faster guest checkout.");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setMessage(error ? error.message : "Check your email for the secure sign-in link.");
  };

  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-5" onMouseDown={onClose}>
    <div className="w-full max-w-md rounded-2xl bg-[#fbf8f1] p-7 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
      <div className="flex items-center justify-between"><h2 className="font-['Cormorant_Garamond',serif] text-3xl font-bold">Your Account</h2><button onClick={onClose}><X size={20}/></button></div>
      {signedInEmail ? <div className="mt-6"><p className="text-sm">{supabase ? "Signed in" : "Guest checkout email"}: <strong>{signedInEmail}</strong></p><button className="mt-5 underline" onClick={() => { if (supabase) void supabase.auth.signOut(); else { localStorage.removeItem("joshua-scents-guest-email"); setSignedInEmail(null); setMessage(""); } }}>Clear account</button></div> : <div className="mt-6">
        <p className="mb-4 text-sm text-black/60">{supabase ? "Enter your email and we will send a password-free sign-in link." : "Save your email on this device for faster guest checkout. No account or password is created."}</p>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-lg border border-black/15 bg-white px-4 py-3" />
        <button onClick={() => void sendLink()} className="mt-4 w-full rounded-md bg-[#171717] px-5 py-3 font-semibold tracking-wider text-white">{supabase ? "EMAIL ME A SIGN-IN LINK" : "SAVE FOR GUEST CHECKOUT"}</button>
      </div>}
      {message && <p className="mt-4 text-sm text-black/60">{message}</p>}
    </div>
  </div>;
}
