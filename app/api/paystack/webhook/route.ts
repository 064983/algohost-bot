import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Payment verification is not configured." }, { status: 503 });
  const rawBody = await request.text();
  const supplied = request.headers.get("x-paystack-signature") ?? "";
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  if (suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(suppliedBytes, expectedBytes)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }
  try {
    const event = JSON.parse(rawBody);
    if (event.event !== "charge.success" || typeof event.data?.reference !== "string") {
      if ((event.event === "charge.failed" || event.event === "refund.processed") &&
          typeof event.data?.reference === "string") {
        const nextStatus = event.event === "charge.failed" ? "failed" : "refunded";
        const db = getSupabaseAdmin();
        const { error } = await db.from("orders").update({ payment_status: nextStatus })
          .eq("payment_reference", event.data.reference)
          .in("payment_status", event.event === "charge.failed" ? ["pending"] : ["paid"]);
        if (error) throw error;
      }
      return NextResponse.json({ received: true });
    }
    const db = getSupabaseAdmin();
    const { data: order, error } = await db.from("orders").select("id,amount_zar,currency,payment_status").eq("payment_reference", event.data.reference).single();
    if (error || !order) return NextResponse.json({ error: "Order for payment reference not found." }, { status: 404 });

    // Independently verify the reference with Paystack; never trust the browser return URL.
    const verification = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(event.data.reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    const result = await verification.json();
    const expectedAmount = Math.round(Number(order.amount_zar) * 100);
    if (!verification.ok || !result.status || result.data?.status !== "success" ||
        result.data?.reference !== event.data.reference ||
        result.data?.currency !== order.currency ||
        Number(result.data?.amount) !== expectedAmount) {
      return NextResponse.json({ error: "Payment verification did not match the order." }, { status: 400 });
    }
    if (order.payment_status !== "paid" && order.payment_status !== "refunded") {
      const { error: updateError } = await db.from("orders").update({
        payment_status: "paid",
        paid_at: new Date().toISOString(),
        paystack_transaction_id: String(result.data.id),
      }).eq("id", order.id).in("payment_status", ["pending", "failed"]);
      if (updateError) throw updateError;
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook processing failed:", error);
    return NextResponse.json({ error: "Could not process payment notification." }, { status: 500 });
  }
}
