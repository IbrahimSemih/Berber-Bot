import { withOwner, serviceResponse } from "@/lib/mobile-api";
import { anonymizeCustomer } from "@/lib/services/customers";

export const dynamic = "force-dynamic";

/** KVKK silme talebi: müşterinin ad ve telefonunu anonimleştirir (abonelik bitmiş olsa da). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  return withOwner(req, {}, async ({ shop }) => serviceResponse(await anonymizeCustomer(shop, params.id)));
}
