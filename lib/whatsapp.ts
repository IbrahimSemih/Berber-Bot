// lib/whatsapp.ts
export async function sendWhatsAppMessage(to: string, message: string) {
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.error("WhatsApp credentials are not configured in .env.local");
    return { success: false, error: "Missing credentials" };
  }

  // Numarayı temizle ve formatla (Türkiye için +90 veya 90)
  let formattedPhone = to.replace(/\D/g, "");
  if (formattedPhone.startsWith("0")) {
    formattedPhone = "90" + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith("90") && formattedPhone.length === 10) {
    formattedPhone = "90" + formattedPhone;
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
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedPhone,
          type: "text",
          text: {
            preview_url: false,
            body: message,
          },
        }),
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
