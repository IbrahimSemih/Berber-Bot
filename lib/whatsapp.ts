const WHATSAPP_API_URL = "https://graph.facebook.com/v19.0";

export async function sendWhatsAppMessage(to: string, text: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !token) {
    console.warn("WhatsApp credentials not configured");
    return null;
  }

  const res = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  return res.json();
}

export async function sendWhatsAppButtons(
  to: string,
  bodyText: string,
  buttons: { id: string; title: string }[]
) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !token) {
    console.warn("WhatsApp credentials not configured");
    return null;
  }

  const res = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText },
        action: {
          buttons: buttons.map((b) => ({
            type: "reply",
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    }),
  });

  return res.json();
}

// ─── Bot conversation state helpers ─────────────────────────────────────
// In production, store this in Redis or Supabase. Here we use in-memory for simplicity.
const conversationState = new Map<string, ConversationState>();

export interface ConversationState {
  step: "idle" | "service_select" | "date_select" | "time_select" | "confirm";
  selectedService?: string;
  selectedDate?: string;
  selectedTime?: string;
}

export function getConversationState(phone: string): ConversationState {
  return conversationState.get(phone) ?? { step: "idle" };
}

export function setConversationState(phone: string, state: ConversationState) {
  conversationState.set(phone, state);
}

export function clearConversationState(phone: string) {
  conversationState.delete(phone);
}

// ─── Message templates ────────────────────────────────────────────────────
export const BOT_MESSAGES = {
  welcome: `Merhaba! 👋 *Maestro Berber*'e hoş geldiniz.

Hangi hizmeti almak istersiniz?`,

  serviceSelected: (service: string, slots: string[]) =>
    `*${service}* seçtiniz ✂️

Müsait saatler:\n${slots.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Lütfen bir numara gönderin (örn: 1)`,

  confirmAppointment: (name: string, service: string, datetime: string) =>
    `✅ *Randevunuz oluşturuldu!*

👤 ${name}
💈 ${service}
📅 ${datetime}
📍 Maestro Berber

Bir gün önce hatırlatma mesajı göndereceğim. Görüşmek üzere! 🙏`,

  reminder: (service: string, datetime: string) =>
    `🔔 *Randevu Hatırlatması*

Yarın randevunuz var!

💈 ${service}
📅 ${datetime}
📍 Maestro Berber

İptal veya erteleme için "iptal" yazabilirsiniz.`,

  cancelled: `Randevunuz iptal edildi ✅

Yeni bir randevu almak için "merhaba" yazabilirsiniz.`,

  notUnderstood: `Anlayamadım 🤔 Randevu almak için *"merhaba"* yazabilirsiniz.`,
};
