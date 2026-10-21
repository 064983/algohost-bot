import { NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseAdmin } from "@/lib/supabase-server";

async function requireAdmin(request: Request) {
  const user = await getAuthenticatedUser(request.headers.get("authorization"));
  if (!user) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  const db = getSupabaseAdmin();
  const { data: profile, error } = await db.from("profiles").select("role").eq("id", user.id).single();
  if (error || profile?.role !== "admin") return { error: NextResponse.json({ error: "Administrator access required." }, { status: 403 }) };
  return { db };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const [products, orders, history, messages, settings, licenses] = await Promise.all([
      auth.db.from("products").select("*").order("created_at", { ascending: false }),
      auth.db.from("orders").select("id,order_number,user_id,product_id,product_name,amount_zar,currency,payment_status,customer_name,customer_email,whatsapp,comments,created_at,paid_at,completed_at,paystack_transaction_id").order("created_at", { ascending: false }).limit(100),
      auth.db.from("license_history").select("id,order_id,admin_id,action,created_at").order("created_at", { ascending: false }).limit(100),
      auth.db.from("order_messages").select("id,order_id,user_id,message,created_at").order("created_at", { ascending: false }).limit(200),
      auth.db.from("site_settings").select("key,value"),
      auth.db.from("license_assignments").select("order_id,unlocking_id,assigned_at").eq("active", true),
    ]);
    for (const result of [products, orders, history, messages, settings, licenses]) if (result.error) throw result.error;
    const orderRows = orders.data;
    const messageRows = messages.data;
    const settingRows = settings.data;
    if (!orderRows || !messageRows || !settingRows) {
      throw new Error("Administrator data query returned no result.");
    }
    const orderNumbers = new Map(orderRows.map(order=>[order.id,order.order_number]));
    return NextResponse.json({
      products: products.data,
      orders: orderRows,
      history: history.data,
      messages: messageRows.map(item=>({...item,order_number:orderNumbers.get(item.order_id)??item.order_id})),
      settings: Object.fromEntries(settingRows.map(item=>[item.key,item.value])),
      licenses: licenses.data,
    });
  } catch (error) {
    console.error("Admin dashboard could not load:", error);
    return NextResponse.json({ error: "Could not load administrator data." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const input = await request.json();
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return NextResponse.json({ error: "Invalid administrator request." }, { status: 400 });
    }
    if (input.action === "assign-id") {
      if (typeof input.orderId !== "string" || typeof input.unlockingId !== "string" || input.unlockingId.trim().length < 4 || input.unlockingId.length > 300) {
        return NextResponse.json({ error: "Provide a valid order and existing activation ID." }, { status: 400 });
      }
      const bearer = request.headers.get("authorization")!;
      const { createClient } = await import("@supabase/supabase-js");
      const userClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: bearer } },
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error } = await userClient.rpc("admin_assign_unlocking_id", {
        p_order_id: input.orderId,
        p_unlocking_id: input.unlockingId.trim(),
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ assigned: true });
    }
    if (input.action === "revoke-id" && typeof input.orderId === "string") {
      const bearer = request.headers.get("authorization")!;
      const { createClient } = await import("@supabase/supabase-js");
      const userClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: bearer } },
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error } = await userClient.rpc("admin_revoke_unlocking_id", { p_order_id: input.orderId });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ revoked: true });
    }
    if (input.action === "request-refund" && typeof input.orderId === "string") {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      if (!secret) return NextResponse.json({ error: "Refund processing is not configured." }, { status: 503 });
      const { data: order, error: orderError } = await auth.db.from("orders")
        .select("id,payment_status,paystack_transaction_id,amount_zar")
        .eq("id", input.orderId).maybeSingle();
      if (orderError) throw orderError;
      if (!order || order.payment_status !== "paid" || !order.paystack_transaction_id) {
        return NextResponse.json({ error: "Only verified Paystack payments can be refunded." }, { status: 400 });
      }
      const refund = await fetch("https://api.paystack.co/refund", {
        method: "POST",
        headers: { Authorization: "Bearer " + secret, "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction: order.paystack_transaction_id,
          amount: Math.round(Number(order.amount_zar) * 100),
        }),
        cache: "no-store",
      });
      const result = await refund.json();
      if (!refund.ok || !result.status) {
        console.error("Paystack refund request failed:", result.message ?? refund.statusText);
        return NextResponse.json({ error: "Paystack could not accept the refund request." }, { status: 502 });
      }
      return NextResponse.json({ requested: true });
    }
    if (input.action === "complete-order" && typeof input.orderId === "string") {
      const { error } = await auth.db.from("orders").update({ completed_at: new Date().toISOString() })
        .eq("id", input.orderId).eq("payment_status", "paid");
      if (error) throw error;
      return NextResponse.json({ completed: true });
    }
    if (input.action === "save-settings") {
      if (typeof input.whatsappNumber !== "string" || !/^\d{8,15}$/.test(input.whatsappNumber)) {
        return NextResponse.json({ error: "Enter an international WhatsApp number using digits only, including the country code." }, { status: 400 });
      }
      const { error } = await auth.db.from("site_settings").upsert({
        key: "whatsapp_number",
        value: input.whatsappNumber,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      return NextResponse.json({ saved: true });
    }
    if (input.action === "save-product") {
      const product = input.product;
      if (!product || typeof product.name !== "string" || typeof product.slug !== "string" ||
          typeof product.description !== "string" || typeof product.platform !== "string" ||
          typeof product.category !== "string" || !Number.isFinite(Number(product.price_zar)) ||
          Number(product.price_zar) < 0 || product.name.length > 100 ||
          product.description.length > 3000 || !/^[a-z0-9-]{2,80}$/.test(product.slug)) {
        return NextResponse.json({ error: "Check product name, slug, price, and required details." }, { status: 400 });
      }
      const row = {
        name: product.name.trim(),
        slug: product.slug,
        category: product.category.trim(),
        description: product.description.trim(),
        platform: product.platform.trim(),
        features: Array.isArray(product.features) ? product.features.filter((item: unknown) => typeof item === "string").slice(0, 12) : [],
        compatibility: typeof product.compatibility === "string" ? product.compatibility.slice(0, 250) : "",
        price_zar: Number(product.price_zar),
        image_url: typeof product.image_url === "string" ? product.image_url.slice(0, 500) : "",
        activation_instructions: typeof product.activation_instructions === "string" ? product.activation_instructions.slice(0, 2000) : "",
        active: product.active !== false,
      };
      const result = product.id
        ? await auth.db.from("products").update(row).eq("id", product.id).select("id").maybeSingle()
        : await auth.db.from("products").insert(row).select("id").single();
      if (result.error) throw result.error;
      if (!result.data) return NextResponse.json({ error: "Product not found." }, { status: 404 });
      return NextResponse.json({ saved: true });
    }
    if (input.action === "remove-product" && typeof input.productId === "string") {
      const { error } = await auth.db.from("products").update({ active: false }).eq("id", input.productId);
      if (error) throw error;
      return NextResponse.json({ removed: true });
    }
    return NextResponse.json({ error: "Unsupported administrator action." }, { status: 400 });
  } catch (error) {
    console.error("Admin update failed:", error);
    return NextResponse.json({ error: "Could not save the requested change." }, { status: 500 });
  }
}
