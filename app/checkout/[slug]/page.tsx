"use client";

import { FormEvent, use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { formatZar } from "@/lib/config";

type Product={id:string;slug:string;name:string;price_zar:number;platform:string;description:string};
export default function CheckoutPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=use(params);
const router=useRouter();const[product,setProduct]=useState<Product|null>(null);const[email,setEmail]=useState("");const[fullName,setFullName]=useState("");const[whatsapp,setWhatsapp]=useState("");const[comments,setComments]=useState("");const[busy,setBusy]=useState(false);const[error,setError]=useState("");
 useEffect(()=>{fetch("/api/products").then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error);setProduct(data.products.find((p:Product)=>p.slug===slug)??null)}).catch(e=>setError(e.message));try{const request=sessionStorage.getItem(`algohost-request:${slug}`);if(request){setComments(request.slice(0,1500));sessionStorage.removeItem(`algohost-request:${slug}`)}void getSupabaseBrowser().auth.getUser().then(({data})=>setEmail(data.user?.email??"")).catch(()=>{});}catch{setError("Sign-in or browser storage is not available. Please contact the site administrator.")}},[slug]);
 async function submit(e:FormEvent){e.preventDefault();setError("");if(!email){router.push(`/login?next=${encodeURIComponent(`/checkout/${slug}`)}`);return}if(!product)return;setBusy(true);
  try{const supabase=getSupabaseBrowser();const{data:{session}}=await supabase.auth.getSession();if(!session)throw new Error("Please sign in before checkout.");const response=await fetch("/api/checkout",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({productId:product.id,fullName,whatsapp,comments})});const result=await response.json();if(!response.ok)throw new Error(result.error??"Could not begin checkout.");window.location.assign(result.authorizationUrl)}catch(reason){setError(reason instanceof Error?reason.message:"Checkout could not be started.")}finally{setBusy(false)}}
 if(error&&!product)return <div className="page-wrap"><div className="empty-state">{error}</div></div>;
 if(!product)return <div className="page-wrap"><p className="muted">Loading checkout…</p></div>;
 return <div className="page-wrap"><div className="section-kicker">Secure checkout</div><h1 className="page-title">Complete your order</h1><p className="muted">Your purchase is an activation ID. No bot files or source code are delivered.</p>
  <div className="product-detail" style={{marginTop:28}}><form className="detail-panel" onSubmit={submit}><h2 style={{fontSize:22}}>Customer details</h2><div className="field"><label htmlFor="full-name">Full name</label><input required id="full-name" maxLength={120} autoComplete="name" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Your name"/></div><div className="field"><label>Email</label>{email?<input value={email} disabled aria-label="Signed in email"/>:<p className="muted">Sign in to continue. <Link className="text-link" href={`/login?next=${encodeURIComponent(`/checkout/${slug}`)}`}>Login / Register</Link></p>}</div>
   <div className="field"><label htmlFor="whatsapp">WhatsApp contact (optional)</label><input id="whatsapp" type="tel" maxLength={30} value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="+27 …"/></div>
   <div className="field"><label htmlFor="comments">Comments or special requests (optional)</label><textarea id="comments" maxLength={1500} value={comments} onChange={e=>setComments(e.target.value)} placeholder="Questions about compatibility or setup? Add them here."/></div>
   <p className="muted" style={{fontSize:12}}>Payment is processed by Paystack. Card details are entered with the payment provider and are not stored by this website. Orders remain Pending until server-side payment verification succeeds.</p>
   <button className="button button-primary" style={{width:"100%",marginTop:15}} disabled={busy}>{busy?"Preparing secure payment…":"Continue to secure payment"}</button>{error&&<p className="form-message error-message" role="alert">{error}</p>}
  </form><aside className="detail-panel"><div className="section-kicker">Order summary</div><h2 style={{fontSize:23}}>{product.name}</h2><p className="muted">{product.platform}</p><p className="muted">{product.description}</p><div className="price" style={{fontSize:27,marginTop:20}}>{formatZar(Number(product.price_zar))}<small>Price in ZAR</small></div><p className="muted" style={{fontSize:12}}>Unlocking ID access only. ID availability is subject to valid ID assignment by the administrator.</p></aside></div>
 </div>;
}
