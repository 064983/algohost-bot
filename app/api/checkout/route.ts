import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getAuthenticatedUser, getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request.headers.get("authorization"));
  if (!user?.email) return NextResponse.json({ error: "Please sign in with a verified email before checkout." }, { status: 401 });
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Online checkout is not configured yet. Contact the seller." }, { status: 503 });

  let input: { productId?: unknown; fullName?: unknown; whatsapp?: unknown; comments?: unknown };
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
  }
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      typeof input.productId !== "string" || input.productId.length > 80 ||
      (input.fullName !== undefined && typeof input.fullName !== "string") ||
      (input.whatsapp !== undefined && typeof input.whatsapp !== "string") ||
      (input.comments !== undefined && typeof input.comments !== "string")) {
    return NextResponse.json({ error: "Select a valid product." }, { status: 400 });
  }
  const fullName = (input.fullName ?? "").trim();
  const whatsapp = (input.whatsapp ?? "").trim();
  const comments = (input.comments ?? "").trim();
  if (fullName.length < 1 || fullName.length > 120 || whatsapp.length > 30 || comments.length > 1500) {
    return NextResponse.json({ error: "Please shorten your contact details or special instructions." }, { status: 400 });
  }

  try {
    const db = getSupabaseAdmin();
    const { error: rateError } = await db.rpc("check_checkout_rate_limit", { p_user_id: user.id });
    if (rateError) {
      if (rateError.message.includes("Checkout limit reached")) {
        return NextResponse.json({ error: rateError.message }, { status: 429 });
      }
      throw rateError;
    }
    const { data: product, error: productError } = await db.from("products").select("id,name,price_zar,active").eq("id", input.productId).single();
    if (productError || !product || !product.active || !Number.isSafeInteger(Math.round(product.price_zar * 100))) {
      return NextResponse.json({ error: "This product is unavailable." }, { status: 404 });
    }
    const orderNumber = `AH-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const reference = `AH-${randomBytes(18).toString("hex")}`;
    const amount = Math.round(product.price_zar * 100);
    const { data: order, error: insertError } = await db.from("orders").insert({
      order_number: orderNumber,
      user_id: user.id,
      product_id: product.id,
      product_name: product.name,
      amount_zar: product.price_zar,
      currency: "ZAR",
      payment_status: "pending",
      payment_reference: reference,
      customer_email: user.email,
      customer_name: fullName,
      whatsapp,
      comments,
    }).select("id").single();
    if (insertError || !order) throw insertError ?? new Error("Could not create order.");

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        amount,
        currency: "ZAR",
        reference,
        callback_url: `${siteUrl}/account?payment=return`,
        metadata: { order_id: order.id, order_number: orderNumber, product: product.name },
      }),
      cache: "no-store",
    });
    const payment = await response.json();
    if (!response.ok || !payment.status || !payment.data?.authorization_url) {
      console.error("Paystack initialization failed:", payment.message ?? response.statusText);
      return NextResponse.json({ error: "Payment could not be started. Please try again or contact support." }, { status: 502 });
    }
    return NextResponse.json({ authorizationUrl: payment.data.authorization_url });
  } catch (error) {
    console.error("Checkout failed:", error);
    return NextResponse.json({ error: "Could not create your order. Please try again." }, { status: 500 });
  }
}
