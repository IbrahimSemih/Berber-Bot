import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const date = searchParams.get("date");

    let query = supabase
      .from("appointments")
      .select(`
        *,
        customer:customers(*),
        service:services(*)
      `)
      .order("scheduled_at", { ascending: true });

    if (status) query = query.eq("status", status);
    if (date) {
      const start = `${date}T00:00:00`;
      const end   = `${date}T23:59:59`;
      query = query.gte("scheduled_at", start).lte("scheduled_at", end);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await req.json();
    const { customer_name, customer_phone, service_id, scheduled_at, source = "manual", notes } = body;

    // Upsert customer
    const { data: customer, error: cErr } = await supabase
      .from("customers")
      .upsert({ name: customer_name, phone: customer_phone }, { onConflict: "phone" })
      .select()
      .single();
    if (cErr) throw cErr;

    // Create appointment
    const { data: apt, error: aErr } = await supabase
      .from("appointments")
      .insert({ customer_id: customer.id, service_id, scheduled_at, source, notes, status: "pending" })
      .select(`*, customer:customers(*), service:services(*)`)
      .single();
    if (aErr) throw aErr;

    return NextResponse.json({ data: apt }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await req.json();
    const { id, status } = body;

    const { data, error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
