"use server";

import { createClient } from "@/lib/supabase/server";

export async function getStaffLeaves(shopId: string, staffId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("staff_leaves")
    .select("*")
    .eq("shop_id", shopId)
    .eq("staff_id", staffId)
    .order("start_date", { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function addStaffLeave(shopId: string, staffId: string, startDate: string, endDate: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  if (new Date(endDate) < new Date(startDate)) {
    return { success: false, error: "Bitiş tarihi başlangıç tarihinden önce olamaz." };
  }

  const { error } = await supabase
    .from("staff_leaves")
    .insert({
      shop_id: shopId,
      staff_id: staffId,
      start_date: startDate,
      end_date: endDate
    });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteStaffLeave(leaveId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("staff_leaves")
    .delete()
    .eq("id", leaveId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
