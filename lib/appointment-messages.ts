// Meta'da onaylı WhatsApp şablonlarının parametre sırası burada sabitlenir.
// Şablon metnini Meta'da değiştirirseniz parametre sırasını burada güncelleyin.
import { sendWhatsAppTemplate } from "@/lib/whatsapp";
import { formatTrDateTime } from "@/lib/time";
import { SITE } from "@/lib/site-config";

export { REMINDER_HOURS_BEFORE } from "@/lib/booking";

export function cancelLinkFor(cancelToken: string) {
  return `${SITE.url}/r/${cancelToken}`;
}

/** randevu_onay: {{1}}=isim, {{2}}=tarih/saat, {{3}}=dükkan, {{4}}=iptal linki */
export function sendAppointmentConfirmation(p: {
  phone: string;
  customerName?: string | null;
  scheduledAt: string | Date;
  shopName?: string | null;
  cancelToken: string;
}) {
  return sendWhatsAppTemplate(p.phone, "randevu_onay", [
    p.customerName || "Değerli Müşterimiz",
    formatTrDateTime(p.scheduledAt),
    p.shopName || "Berber",
    cancelLinkFor(p.cancelToken),
  ]);
}

/** randevu_iptal: {{1}}=isim, {{2}}=tarih/saat, {{3}}=hizmet, {{4}}=dükkan */
export function sendAppointmentCancellation(p: {
  phone: string;
  customerName?: string | null;
  scheduledAt: string | Date;
  serviceName?: string | null;
  shopName?: string | null;
}) {
  return sendWhatsAppTemplate(p.phone, "randevu_iptal", [
    p.customerName || "Değerli Müşterimiz",
    formatTrDateTime(p.scheduledAt),
    p.serviceName || "randevu",
    p.shopName || "Berber",
  ]);
}

/** randevu_hatirlatma: {{1}}=isim, {{2}}=tarih/saat, {{3}}=dükkan, {{4}}=hizmet */
export function sendAppointmentReminder(p: {
  phone: string;
  customerName?: string | null;
  scheduledAt: string | Date;
  shopName?: string | null;
  serviceName?: string | null;
}) {
  return sendWhatsAppTemplate(p.phone, "randevu_hatirlatma", [
    p.customerName || "Değerli Müşterimiz",
    formatTrDateTime(p.scheduledAt),
    p.shopName || "Berber",
    p.serviceName || "randevu",
  ]);
}

export function newCancelToken() {
  // 20 hex karakter (80 bit): tahmin edilemez iptal linki
  return crypto.randomUUID().replace(/-/g, "").substring(0, 20);
}
