import { withOwner, readJsonBody, serviceResponse, apiError } from "@/lib/mobile-api";
import { createManualAppointment } from "@/lib/services/appointments";
import type { CreateAppointmentResponse } from "@/shared/api-types";

export const dynamic = "force-dynamic";

/** Manuel randevu ekleme (telefonla / yüz yüze alınan randevu). */
export async function POST(req: Request) {
  return withOwner(req, { requireActive: true }, async (ctx) => {
    const body = await readJsonBody(req);
    if (!body) return apiError(400, "invalid", "Geçersiz istek.");
    const result = await createManualAppointment(ctx, {
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      serviceId: body.serviceId,
      staffId: body.staffId ?? null,
      date: body.date,
      time: body.time,
      notify: body.notify === true,
    });
    return serviceResponse(
      result,
      (r): CreateAppointmentResponse => ({ appointmentId: r.appointmentId, notified: r.notified })
    );
  });
}
