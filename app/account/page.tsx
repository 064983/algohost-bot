"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Copy, LogOut, RefreshCw } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { formatZar } from "@/lib/config";
import { WhatsAppLink } from "@/components/whatsapp-link";

type Order = {
  id: string; order_number: string; product_name: string; amount_zar: number;
  payment_status: "pending"|"paid"|"failed"|"refunded"; comments: string | null;
  created_at: string; paid_at: string | null;
};
type License = { order_id: string; unlocking_id: string; activation_instructions: string | null };
type OrderMessage = { id: string; order_id: string; user_id: string; message: string; created_at: string };

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [drafts, setDrafts] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const supabase = getSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setEmail(""); setLoading(false); return; }
      setEmail(user.email ?? "");
      const { data, error: orderError } = await supabase.from("orders")
        .select("id,order_number,product_name,amount_zar,payment_status,comments,created_at,paid_at")
        .order("created_at", { ascending: false });
      if (orderError) throw orderError;
      const safeOrders = (data ?? []) as Order[];
      setOrders(safeOrders);
      const { data: messageRows, error: messageError } = await supabase.from("order_messages")
        .select("id,order_id,user_id,message,created_at").order("created_at");
      if (messageError) throw messageError;
      setMessages((messageRows ?? []) as OrderMessage[]);
      if (safeOrders.some(o => o.payment_status === "paid")) {
        const { data: keys, error: keysError } = await supabase.from("license_assignments")
          .select("order_id,unlocking_id,activation_instructions");
        if (keysError) throw keysError;
        setLicenses((keys ?? []) as License[]);
      } else setLicenses([]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load your orders.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  async function signOut() {
    await getSupabaseBrowser().auth.signOut();
    setEmail(""); setOrders([]); setLicenses([]);
  }
  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setNotice("Unlocking ID copied.");
    window.setTimeout(() => setNotice(""), 2500);
  }
  async function sendMessage(orderId: string) {
    const message = (drafts[orderId] ?? "").trim();
    if (!message || message.length > 1500) return;
    setError("");
    try {
      const supabase = getSupabaseBrowser();
      const { error: messageError } = await supabase.rpc("submit_order_message", {
        p_order_id: orderId,
        p_message: message,
      });
      if (messageError) throw messageError;
      setDrafts(v => ({ ...v, [orderId]: "" }));
      await load();
    } catch(reason) {
      setError(reason instanceof Error ? reason.message : "Could not send your message.");
    }
  }

  if (loading) return <div className="page-wrap"><p className="muted">Loading your private orders…</p></div>;
  if (!email) return <div className="page-wrap"><div className="empty-state"><h2>Sign in to view your orders</h2><p>Your purchases and activation IDs are private to your account.</p><Link className="button button-primary" href="/login?next=%2Faccount">Login / Register</Link></div></div>;
  return <div className="page-wrap">
    <div className="section-head"><div><div className="section-kicker">Private customer area</div><h1 className="page-title">My Orders</h1><p className="muted">Signed in as {email}. Unlocking IDs appear only after payment verification and manual assignment.</p></div><button className="button button-outline" onClick={()=>void signOut()}><LogOut size={15}/> Sign out</button></div>
    <button className="button button-outline" onClick={()=>void load()}><RefreshCw size={14}/> Refresh orders</button>
    {notice&&<p className="form-message" role="status">{notice}</p>}{error&&<p className="form-message error-message">{error}</p>}
    {orders.length===0?<div className="empty-state" style={{marginTop:22}}>No orders yet. <Link className="text-link" href="/#bots">Browse trading bots</Link></div>:
      <div className="order-list">{orders.map(order=>{
        const license=licenses.find(item=>item.order_id===order.id);
        return <article className="order-row" key={order.id}>
          <div><div className="product-meta"><span className="tag">{order.order_number}</span><span className={`status ${order.payment_status==="paid"?"status-paid":""}`}>{order.payment_status.toUpperCase()}</span></div>
            <h3>{order.product_name}</h3><p className="muted" style={{margin:"5px 0",fontSize:12}}>{formatZar(Number(order.amount_zar))} · {new Date(order.created_at).toLocaleDateString("en-ZA")}</p>
            {order.comments&&<details style={{marginTop:10}}><summary className="text-link">Your request / comment</summary><p className="muted">{order.comments}</p></details>}
            <details style={{marginTop:10}}><summary className="text-link">Order questions and messages</summary>
              {messages.filter(item=>item.order_id===order.id).map(item=><p className="muted" key={item.id}>{item.message}<br/><small>{new Date(item.created_at).toLocaleString("en-ZA")}</small></p>)}
              <div className="field"><label htmlFor={`message-${order.id}`}>Send a private message about this order</label><textarea id={`message-${order.id}`} maxLength={1500} value={drafts[order.id]??""} onChange={e=>setDrafts(v=>({...v,[order.id]:e.target.value}))}/><button className="button button-outline button-small" type="button" style={{marginTop:8}} onClick={()=>void sendMessage(order.id)} disabled={!drafts[order.id]?.trim()}>Send to administrator</button></div>
            </details>
            {license&&order.payment_status==="paid"?<div className="license-box"><strong>Unlocking ID:</strong> {license.unlocking_id}<button className="button button-small button-outline" style={{marginLeft:10}} onClick={()=>void copy(license.unlocking_id)}><Copy size={13}/> Copy</button>{license.activation_instructions&&<details style={{marginTop:12,color:"var(--text)",fontFamily:"var(--font-body)"}}><summary>Activation instructions</summary><p className="muted">{license.activation_instructions}</p></details>}</div>:order.payment_status==="paid"?<p className="muted">Payment confirmed. Your activation ID will appear here after the administrator assigns a valid ID for this bot.</p>:order.payment_status==="pending"?<p className="muted">Payment is awaiting provider confirmation. Refresh this page after completing checkout.</p>:null}
            {order.payment_status==="paid"&&<WhatsAppLink className="button button-primary button-small" message={`Hello Algohost Bot, I need help with order ${order.order_number} for ${order.product_name}.`}>Contact Me on WhatsApp for Activation Help</WhatsAppLink>}
          </div>
        </article>;
      })}</div>}
  </div>;
}
