// lib/whatsapp.ts

function formatPhoneNumber(to: string) {
  let formattedPhone = to.replace(/\D/g, "");
  if (formattedPhone.startsWith("0")) {
    formattedPhone = "90" + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith("90") && formattedPhone.length === 10) {
    formattedPhone = "90" + formattedPhone;
  }
  return formattedPhone;
}

async function sendWhatsAppPayload(payload: Record<string, unknown>) {
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.error("WhatsApp credentials are not configured in .env.local");
    return { success: false, error: "Missing credentials" };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp Cloud API Error:", data);
      return { success: false, error: data.error?.message || "Unknown error" };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Failed to send WhatsApp message via Cloud API:", error);
    return { success: false, error: error.message };
  }
}

// Serbest metin mesajı: SADECE müşteri son 24 saat içinde bize yazdıysa çalışır
// (WhatsApp "customer service window" kuralı). İşletme tarafından başlatılan
// randevu onayı/iptali gibi proaktif mesajlarda bunun yerine
// sendWhatsAppTemplate kullanılmalı, aksi halde Meta mesajı reddeder.
export async function sendWhatsAppMessage(to: string, message: string) {
  return sendWhatsAppPayload({
    messaging_product: "whatsapp",
    to: formatPhoneNumber(to),
    type: "text",
    text: {
      preview_url: false,
      body: message,
    },
  });
}

// Meta'da onaylanmış bir mesaj şablonu (örn. "randevu_onay") ile mesaj gönderir.
// bodyParams sırasıyla şablondaki {{1}}, {{2}}, {{3}}... değişkenlerine karşılık gelir.
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  bodyParams: string[],
  languageCode: string = "tr"
) {
  return sendWhatsAppPayload({
    messaging_product: "whatsapp",
    to: formatPhoneNumber(to),
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: [
        {
          type: "body",
          parameters: bodyParams.map((text) => ({ type: "text", text })),
        },
      ],
    },
  });
}
