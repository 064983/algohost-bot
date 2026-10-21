 "use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, Check, ChevronRight, Clock3, Fingerprint, Headset, MessageCircle, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { formatZar } from "@/lib/config";
import { WhatsAppLink } from "@/components/whatsapp-link";

const samples = [
  { slug: "mt4-forex-starter", name: "MT4 Forex Starter", category: "MetaTrader 4", description: "A sample listing for an MT4-compatible trading tool. Review compatibility and setup requirements before purchase.", price: 499, features: ["MT4 compatible", "Manual activation ID", "Setup guidance"] },
  { slug: "mt5-trend-suite", name: "MT5 Trend Suite", category: "MetaTrader 5", description: "A sample listing for a trend-following tool for MetaTrader 5. Confirm your platform version before ordering.", price: 699, features: ["MT5 compatible", "Trend-following", "Activation support"] },
  { slug: "crypto-signal-tool", name: "Crypto Signal Tool", category: "Crypto", description: "A sample crypto-tool listing. Check supported exchanges and product compatibility with the seller first.", price: 599, features: ["Crypto markets", "Compatibility check", "Manual activation ID"] },
];
const categories = ["MetaTrader 4 (MT4) Forex Bots", "MetaTrader 5 (MT5) Forex Bots", "Scalping Bots", "Trend-Following Bots", "Crypto Trading Bots", "Custom Trading Bots"];
type Listing = { id?: string; slug: string; name: string; category: string; description: string; price_zar: number; features: string[]; image_url?: string };

export default function Home() {
  const [listings, setListings] = useState<Listing[]>(samples.map(item => ({
    slug:item.slug,name:item.name,category:item.category,description:item.description,price_zar:item.price,features:item.features,
  })));
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  useEffect(() => {
    fetch("/api/products").then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Live catalog is unavailable.");
      if (!Array.isArray(result.products)) throw new Error("Live catalog returned an invalid response.");
      setListings(result.products);
      setCatalogReady(true);
    }).catch(error => {
      setCatalogError(error instanceof Error ? error.message : "Live catalog is unavailable.");
    });
  }, []);
  return <>
    <section className="hero">
      <div>
        <div className="eyebrow"><span className="dot" /> Your next step in automated trading</div>
        <h1>Unlock Your Trading Potential with <em>Algohost Bot.</em></h1>
        <p className="hero-copy">Discover automated trading tools, choose the bot that fits your needs, purchase your unlocking ID securely, and get direct support through WhatsApp.</p>
        <div className="hero-actions">
          <Link className="button button-primary" href="#bots">Explore Trading Bots <ArrowRight size={17} /></Link>
          <Link className="button button-outline" href="#bots">Browse Prices</Link>
          <WhatsAppLink className="button button-outline">Contact Us on WhatsApp</WhatsAppLink>
        </div>
        <div className="hero-notes"><span><ShieldCheck size={15} /> Secure payment flow</span><span><Fingerprint size={15} /> Activation ID, not downloads</span></div>
      </div>
      <div className="visual-card" aria-label="Abstract trading chart illustration">
        <div className="visual-top"><span>MARKET OVERVIEW · DEMO VISUAL</span><span className="live-pill">● Platform ready</span></div>
        <div className="float-chip"><span>Access model</span><strong>Activation ID</strong></div>
        <svg className="chart" viewBox="0 0 560 210" preserveAspectRatio="none" role="img" aria-label="Decorative upward and downward market chart">
          <defs><linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#4c9dff"/><stop offset="1" stopColor="#55e6a5"/></linearGradient><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#55e6a5" stopOpacity=".2"/><stop offset="1" stopColor="#55e6a5" stopOpacity="0"/></linearGradient></defs>
          {[25,70,115,160,205].map(y=><line key={y} className="chart-grid" x1="0" x2="560" y1={y} y2={y}/>)}<path className="chart-fill" d="M0 165 C32 153 43 174 69 145 S107 159 135 123 S171 144 199 113 S228 132 253 91 S291 117 320 82 S362 101 391 65 S425 94 451 52 S491 79 520 38 S541 51 560 25 V210 H0Z"/><path className="chart-line" d="M0 165 C32 153 43 174 69 145 S107 159 135 123 S171 144 199 113 S228 132 253 91 S291 117 320 82 S362 101 391 65 S425 94 451 52 S491 79 520 38 S541 51 560 25"/>
        </svg>
        <div className="chart-labels"><span>09:00</span><span>11:00</span><span>13:00</span><span>15:00</span><span>17:00</span></div>
        <div className="visual-stat"><div><span>Simple checkout</span><strong>Choose · Pay · Activate</strong></div><div className="safe"><Check size={14} /> Human-verified IDs</div></div>
      </div>
    </section>

    <section className="section" id="bots">
      <div className="section-head"><div><div className="section-kicker">Marketplace</div><h2>Find your trading tool</h2><p className="section-sub">Browse sample listings by platform and style. Listings are editable once your admin account and database are configured.</p></div><span className="text-link">Prices shown in ZAR ↗</span></div>
      {catalogError&&<p className="form-message error-message" role="alert">Live listings could not be loaded: {catalogError} Sample listings are shown for preview only; purchases are disabled until the catalog is configured.</p>}
      {listings.length?<div className="product-grid">{listings.map((bot, i)=><article className="product-card" key={bot.id ?? bot.slug}>
        {bot.image_url?<img className="product-image" src={bot.image_url} alt={`${bot.name} product illustration`} loading="lazy"/>:<div className="product-icon">{i===0?<TrendingUp size={22}/>:i===1?<Bot size={22}/>:<Sparkles size={22}/>}</div>}
        <div className="product-meta"><span className="tag">{bot.category}</span><span className="tag">Unlocking ID only</span></div>
        <h3>{bot.name}</h3><p>{bot.description}</p>
        <div className="feature-list">{bot.features?.map(f=><span key={f}>{f}</span>)}</div>
        <div className="card-bottom"><div className="price">{formatZar(Number(bot.price_zar))}<small>One-time ID access</small></div><div className="card-actions">{catalogReady?<><Link className="button button-outline" href={`/bot/${bot.slug}`}>Details</Link><Link className="button button-primary" href={`/checkout/${bot.slug}`}>Buy</Link></>:<span className="tag">Preview only</span>}</div></div>
      </article>)}</div>:<div className="empty-state">No products are currently available. Please check back soon or ask the seller on WhatsApp.</div>}
      <p className="muted" style={{fontSize:12,marginTop:18}}>{catalogReady?"Catalog managed by your administrator. Confirm compatibility with the seller before purchase.":"Sample catalog and prices. Configure Supabase and replace them with verified product details before taking orders."} No performance statistics are claimed.</p>
    </section>

    <div className="feature-band"><section className="section"><div className="feature-grid">
      <div className="feature-item"><ShieldCheck size={24}/><h3>Payment verified</h3><p>Orders unlock only after the payment provider confirms a successful transaction.</p></div>
      <div className="feature-item"><Fingerprint size={24}/><h3>Correct ID, assigned manually</h3><p>Only an existing, valid activation ID should be assigned to a paid order.</p></div>
      <div className="feature-item"><Headset size={24}/><h3>Direct human support</h3><p>Have questions about compatibility? Contact the owner directly on WhatsApp.</p></div>
      <div className="feature-item"><Clock3 size={24}/><h3>Order history</h3><p>Sign in to review order status, access an assigned ID, and read activation instructions.</p></div>
    </div></section></div>

    <section className="section" id="categories"><div className="section-head"><div><div className="section-kicker">Explore by category</div><h2>Tools for your workflow</h2><p className="section-sub">Sample categories to organize your catalog. Confirm supported platforms with the seller before purchasing.</p></div></div><div className="feature-grid">{categories.map((c,i)=><div className="step" key={c}><div className="product-meta"><span className="tag">0{i+1}</span><ChevronRight size={16} color="var(--green)"/></div><h3>{c}</h3><p>Listings can be added and maintained from the administrator area.</p></div>)}</div></section>

    <section className="section" id="how-it-works"><div className="section-head"><div><div className="section-kicker">Simple process</div><h2>From selection to activation</h2><p className="section-sub">A clear purchase flow—your product is an activation ID, not software files or source code.</p></div></div><div className="steps">
      <div className="step"><h3>Choose a bot</h3><p>Review the listing, platform requirements, price, and risk information.</p></div><div className="step"><h3>Enter your details</h3><p>Sign in, provide an email, optional WhatsApp number, and any special requests.</p></div><div className="step"><h3>Pay securely</h3><p>Paystack confirms the payment on the server. A receipt or button click alone never marks an order paid.</p></div><div className="step"><h3>Receive your ID</h3><p>After verification and manual assignment of a valid ID, view it privately in My Orders.</p></div>
    </div></section>
    <section className="section"><div className="section-head"><div><div className="section-kicker">Common questions</div><h2>Good to know</h2></div></div><div className="faq-list">
      <div className="faq"><h3>What do I receive when I buy?</h3><p>A valid activation/unlocking ID for the selected bot after payment is verified and the administrator assigns an existing ID. No bot files or source code are delivered.</p></div>
      <div className="faq"><h3>Are profits guaranteed?</h3><p>No. Trading involves risk. Bots do not guarantee profits, and past performance does not guarantee future results.</p></div>
      <div className="faq"><h3>When will my ID appear?</h3><p>After Paystack confirms the payment and an administrator assigns a valid ID compatible with that product.</p></div>
      <div className="faq"><h3>Can I check compatibility first?</h3><p>Yes. Contact the seller on WhatsApp with your platform and version details before placing an order.</p></div>
    </div></section>
    <section className="section" id="contact"><div className="support-panel"><div><div className="section-kicker">We’re here to help</div><h2>Questions before you activate?</h2><p>Ask about supported platform versions, your order, or how your activation ID works. WhatsApp is our main support channel.</p></div><WhatsAppLink className="button button-primary"><MessageCircle size={17}/> Contact Us on WhatsApp</WhatsAppLink></div></section>
  </>;
}
