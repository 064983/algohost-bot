import { NextResponse } from "next/server";
import { business } from "@/lib/config";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin().from("site_settings")
      .select("value").eq("key", "whatsapp_number").maybeSingle();
    if (error) throw error;
    return NextResponse.json({ whatsappNumber: data?.value ?? business.whatsappNumber });
  } catch (error) {
    console.error("Site settings unavailable:", error);
    return NextResponse.json({ error: "Site settings are not configured." }, { status: 503 });
  }
}
