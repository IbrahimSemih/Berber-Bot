"use server";

import { requireOwner } from "@/lib/owner";
import {
  cancelAppointment,
  confirmAppointment,
  createManualAppointment,
  type ManualAppointmentInput,
} from "@/lib/services/appointments";

// İş mantığı lib/services/appointments.ts içinde (mobil API de aynısını kullanır).

type ActionResult = { success: true; notified: boolean } | { success: false; error: string };

/**
 * Bekleyen randevuyu onaylar ve müşteriye WhatsApp onay şablonunu gönderir.
 * `_shopId` geriye dönük uyumluluk için duruyor; dükkan her zaman oturumdan okunur.
 */
export async function confirmAppointmentAndNotify(appointmentId: string, _shopId?: string): Promise<ActionResult> {
  const auth = await requireOwner({ requireActive: true });
  if ("error" in auth) return { success: false, error: auth.error };
  return confirmAppointment(auth.ctx, appointmentId);
}

/** İşletme randevuyu iptal eder; ileri tarihli randevularda müşteriye WhatsApp iptal şablonu gider. */
export async function cancelAppointmentByOwner(appointmentId: string): Promise<ActionResult> {
  const auth = await requireOwner();
  if ("error" in auth) return { success: false, error: auth.error };
  return cancelAppointment(auth.ctx, appointmentId);
}

/** Panelden manuel randevu ekleme (telefonla/yüz yüze alınan randevular). */
export async function createAppointmentByOwner(input: ManualAppointmentInput): Promise<ActionResult> {
  const auth = await requireOwner({ requireActive: true });
  if ("error" in auth) return { success: false, error: auth.error };
  const result = await createManualAppointment(auth.ctx, input);
  return result.success ? { success: true, notified: result.notified } : result;
}
