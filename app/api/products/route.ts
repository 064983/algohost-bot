import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from("products").select("id,slug,name,category,description,platform,features,compatibility,price_zar,image_url").eq("active", true).order("created_at");
    if (error) throw error;
    return NextResponse.json({ products: data });
  } catch (error) {
    console.error("Product catalog unavailable:", error);
    return NextResponse.json({ error: "Product catalog is not configured yet." }, { status: 503 });
  }
}
