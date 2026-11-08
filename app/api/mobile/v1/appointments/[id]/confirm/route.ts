import { withOwner, serviceResponse } from "@/lib/mobile-api";
import { confirmAppointment } from "@/lib/services/appointments";
import type { AppointmentActionResponse } from "@/shared/api-types";

export const dynamic = "force-dynamic";

/** Bekleyen randevuyu onaylar; müşteriye WhatsApp onay mesajı gider. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  return withOwner(req, { requireActive: true }, async (ctx) =>
    serviceResponse(await confirmAppointment(ctx, params.id), (r): AppointmentActionResponse => ({ notified: r.notified }))
  );
}
