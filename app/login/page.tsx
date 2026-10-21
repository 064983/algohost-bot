"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [next, setNext] = useState("/account");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("next");
    if (requested?.startsWith("/") && !requested.startsWith("//")) setNext(requested);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError(false);
    try {
      const supabase = getSupabaseBrowser();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}${next}` },
      });
      if (authError) throw authError;
      setMessage("Check your email for a secure sign-in link. You can close this page after opening it.");
    } catch (reason) {
      setError(true);
      setMessage(reason instanceof Error ? reason.message : "Could not send the sign-in link.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="page-wrap"><div className="form-card">
    <div className="section-kicker">Customer account</div><h1>Sign in or register</h1>
    <p className="muted">Enter your email and we’ll send a secure sign-in link. No password to remember.</p>
    <form onSubmit={submit}>
      <div className="field"><label htmlFor="email">Email address</label><input required id="email" type="email" autoComplete="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div>
      <button className="button button-primary" type="submit" disabled={busy} style={{marginTop:20,width:"100%"}}>{busy?"Sending link…":"Email me a sign-in link"}</button>
    </form>
    {message&&<p className={`form-message ${error?"error-message":""}`} role="status">{message}</p>}
    <p className="muted" style={{fontSize:12,marginTop:20}}>By continuing, you agree to our <Link className="text-link" href="/terms">terms</Link> and acknowledge our <Link className="text-link" href="/privacy">privacy policy</Link>.</p>
  </div></div>;
}
