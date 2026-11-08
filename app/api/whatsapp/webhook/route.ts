import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { autoReplyLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const AUTO_REPLY =
  "Merhaba! Bu numara BerberBot randevu bildirim hattıdır ve mesajlara yanıt verilmemektedir. " +
  "Randevunuzu iptal etmek için size gönderilen mesajdaki bağlantıyı kullanabilir, diğer konular için " +
  "randevu aldığınız işletmeyle doğrudan iletişime geçebilirsiniz.";

// Meta, webhook adresini doğrularken GET isteği gönderir
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  if (VERIFY_TOKEN && mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/**
 * İsteğin gerçekten Meta'dan geldiğini X-Hub-Signature-256 başlığıyla doğrular.
 * WHATSAPP_APP_SECRET (Meta App > Settings > Basic > App Secret) tanımlı değilse
 * doğrulama atlanır; canlı ortamda mutlaka tanımlayın.
 */
function isValidSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.warn("WHATSAPP_APP_SECRET tanımlı değil: webhook imzası doğrulanmıyor.");
    }
    return true;
  }
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const received = signatureHeader.slice("sha256=".length);
  if (!/^[0-9a-f]{64}$/i.test(received)) return false;
  return crypto.timingSafeEqual(Buffer.from(received.toLowerCase(), "hex"), Buffer.from(expected, "hex"));
}

// Meta, mesaj ve durum güncellemelerini POST ile gönderir
export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!isValidSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body?.object !== "whatsapp_business_account") {
    return NextResponse.json({ error: "Not a WhatsApp event" }, { status: 404 });
  }

  try {
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        for (const message of change.value?.messages ?? []) {
          const from: string | undefined = message?.from;
          if (!from) continue;

          // Aynı numaraya en fazla birkaç otomatik yanıt (döngü/spam koruması)
          const { success } = await autoReplyLimiter.limit(`wa_autoreply_${from}`);
          if (!success) continue;

          await sendWhatsAppMessage(from, AUTO_REPLY);
        }
      }
    }
  } catch (error) {
    // Meta 200 dışı yanıtlarda tekrar dener; hatayı loglayıp 200 dönüyoruz
    console.error("Webhook error:", error);
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
