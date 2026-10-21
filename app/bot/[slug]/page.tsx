"use client";

import { FormEvent, use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, MessageCircle } from "lucide-react";
import { formatZar, riskDisclaimer } from "@/lib/config";
import { WhatsAppLink } from "@/components/whatsapp-link";

type Product = { id: string; slug: string; name: string; category: string; description: string; platform: string; features: string[]; compatibility: string; price_zar: number; activation_instructions: string; image_url?: string };
export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [product,setProduct]=useState<Product|null>(null);
  const [error,setError]=useState("");
  const [question,setQuestion]=useState("");
  useEffect(()=>{fetch("/api/products").then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);setProduct(d.products.find((p:Product)=>p.slug===slug)??null)}).catch(e=>setError(e.message));},[slug]);
  function continueToCheckout(event: FormEvent) {
    event.preventDefault();
    try {
      sessionStorage.setItem(`algohost-request:${slug}`, question.trim().slice(0, 1500));
      router.push(`/checkout/${slug}`);
    } catch {
      setError("Your request could not be saved in this browser. Please try checkout again or contact the seller on WhatsApp.");
    }
  }
  if(error)return <div className="page-wrap"><div className="empty-state">{error}</div></div>;
  if(!product)return <div className="page-wrap"><p className="muted">Loading product details…</p></div>;
  return <div className="page-wrap">
    <div className="section-kicker"><Link href="/#bots">Trading Bots</Link> / {product.category}</div>
    <div className="product-detail"><article>{product.image_url?<img className="product-image" src={product.image_url} alt={`${product.name} product image`}/>:<div className="product-icon"><Bot size={24}/></div>}<h1 className="page-title" style={{marginTop:20}}>{product.name}</h1><p className="muted">{product.description}</p>
      <h2 style={{fontSize:23,marginTop:32}}>Features</h2><div className="feature-list" style={{marginTop:14}}>{product.features?.map(f=><span key={f}>{f}</span>)}</div>
      <h2 style={{fontSize:23,marginTop:30}}>Platform & compatibility</h2><p className="muted"><strong>Platform:</strong> {product.platform}</p><p className="muted"><strong>Compatibility:</strong> {product.compatibility || "Confirm the exact version with the seller before ordering."}</p>
      <h2 style={{fontSize:23,marginTop:30}}>Questions & special requests</h2><p className="muted">Ask a question, request compatibility details, or describe your trading platform. If you continue to checkout, this message will be attached privately to your order for the administrator.</p>
      <form onSubmit={continueToCheckout} className="detail-panel" style={{marginTop:14}}>
        <div className="field"><label htmlFor="product-question">Your question or request (optional)</label><textarea id="product-question" maxLength={1500} value={question} onChange={event=>setQuestion(event.target.value)} placeholder="For example: I use MetaTrader 5 build … Can you confirm compatibility?"/></div>
        <button className="button button-outline" type="submit">Continue to checkout with request</button>
      </form>
      {error&&<p className="form-message error-message" role="alert">{error}</p>}
      <WhatsAppLink className="button button-outline" message={`Hello Algohost Bot, I have a question about ${product.name}. Please help me check compatibility before I buy.`}><MessageCircle size={16}/> Contact Seller</WhatsAppLink>
      <h2 style={{fontSize:23,marginTop:30}}>Frequently asked questions</h2>
      <div className="faq-list" style={{marginTop:14}}>
        <div className="faq"><h3>Does this purchase include the bot software?</h3><p>No. It is for an activation ID only. No downloads or source code are provided.</p></div>
        <div className="faq"><h3>Will this ID work with my version?</h3><p>Compatibility depends on the actual product licensing system. Confirm your platform and version with the seller before buying.</p></div>
        <div className="faq"><h3>When is the ID provided?</h3><p>Only after payment is verified and an administrator assigns an existing valid ID for this product.</p></div>
      </div>
      <div className="risk-note">{riskDisclaimer}</div>
    </article>
    <aside className="detail-panel"><span className="tag">{product.category}</span><h2 style={{fontSize:25,marginTop:15}}>{product.name}</h2><p className="muted">Activation ID access · No file or source-code delivery</p><div className="price" style={{fontSize:26,margin:"22px 0"}}>{formatZar(Number(product.price_zar))}<small>South African Rand (ZAR)</small></div><Link className="button button-primary" style={{width:"100%"}} href={`/checkout/${product.slug}`}>Buy Now</Link><p className="muted" style={{fontSize:11,marginTop:15}}>An ID is provided only after verified payment and manual assignment of an existing, valid code.</p></aside></div>
  </div>;
}
