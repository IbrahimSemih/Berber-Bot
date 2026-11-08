import { withOwner, serviceResponse } from "@/lib/mobile-api";
import { cancelAppointment } from "@/lib/services/appointments";
import type { AppointmentActionResponse } from "@/shared/api-types";

export const dynamic = "force-dynamic";

/** Randevuyu iptal eder (abonelik bitmiş olsa da çalışır; o durumda WhatsApp gitmez). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  return withOwner(req, {}, async (ctx) =>
    serviceResponse(await cancelAppointment(ctx, params.id), (r): AppointmentActionResponse => ({ notified: r.notified }))
  );
}
