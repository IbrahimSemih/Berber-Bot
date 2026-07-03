import { NextResponse } from "next/server";
import { 
  sendWelcomeEmail, 
  sendSubscriptionSuccessEmail, 
  sendSubscriptionFailedEmail,
  sendSecurityAlertEmail 
} from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, type } = body;

    if (!email || !name || !type) {
      return NextResponse.json(
        { error: "Email, name ve type zorunludur." },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case "welcome":
        result = await sendWelcomeEmail(email, name);
        break;
      case "subscription_success":
        result = await sendSubscriptionSuccessEmail(email, name, "Pro", "₺499");
        break;
      case "subscription_failed":
        result = await sendSubscriptionFailedEmail(email, name, "Pro", "Yetersiz bakiye");
        break;
      case "security_reset":
        result = await sendSecurityAlertEmail(email, name, "password_reset", "192.168.1.1", "https://berberbot.com/reset");
        break;
      case "security_login":
        result = await sendSecurityAlertEmail(email, name, "new_login", "192.168.1.1");
        break;
      default:
        return NextResponse.json(
          { error: "Geçersiz email tipi." },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({ message: "E-posta başarıyla gönderildi.", data: result.data });
    } else {
      return NextResponse.json(
        { error: "E-posta gönderilemedi.", details: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Test email API error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
