"use server";

import { requireOwner } from "@/lib/owner";
import { isValidDateString } from "@/lib/time";

// shopId parametresi geriye dönük uyumluluk için duruyor; her zaman oturumdaki
// kullanıcının kendi dükkanı kullanılır.

async function ownsStaff(supabase: any, shopId: string, staffId: string) {
  const { data } = await supabase.from("staff").select("id").eq("id", staffId).eq("shop_id", shopId).maybeSingle();
  return !!data;
}

export async function getStaffLeaves(_shopId: string, staffId: string) {
  const auth = await requireOwner();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase, shop } = auth.ctx;

  const { data, error } = await supabase
    .from("staff_leaves")
    .select("*")
    .eq("shop_id", shop.id)
    .eq("staff_id", staffId)
    .order("start_date", { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function addStaffLeave(_shopId: string, staffId: string, startDate: string, endDate: string) {
  const auth = await requireOwner({ requireActive: true });
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase, shop } = auth.ctx;

  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    return { success: false, error: "Lütfen geçerli bir tarih seçin." };
  }
  if (endDate < startDate) {
    return { success: false, error: "Bitiş tarihi başlangıç tarihinden önce olamaz." };
  }
  if (!(await ownsStaff(supabase, shop.id, staffId))) {
    return { success: false, error: "Personel bulunamadı." };
  }

  const { error } = await supabase
    .from("staff_leaves")
    .insert({
      shop_id: shop.id,
      staff_id: staffId,
      start_date: startDate,
      end_date: endDate
    });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteStaffLeave(leaveId: string) {
  const auth = await requireOwner({ requireActive: true });
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase, shop } = auth.ctx;

  const { error } = await supabase
    .from("staff_leaves")
    .delete()
    .eq("id", leaveId)
    .eq("shop_id", shop.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
