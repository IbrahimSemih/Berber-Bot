import { Resend } from "resend";
import WelcomeEmail from "@/components/emails/WelcomeEmail";
import SubscriptionEmail from "@/components/emails/SubscriptionEmail";
import SecurityAlertEmail from "@/components/emails/SecurityAlertEmail";
import { render } from "@react-email/components";

const resend = new Resend(process.env.RESEND_API_KEY || "re_test_key");

const SENDER_EMAIL = "BerberBot Destek <onboarding@resend.dev>"; // Üretim aşamasında kendi domaininizle değiştirmelisiniz (örn: destek@berberbot.com)

export const sendWelcomeEmail = async (email: string, name: string) => {
  try {
    const data = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: "BerberBot'a Hoş Geldiniz!",
      html: await render(WelcomeEmail({ name })),
    });
    return { success: true, data };
  } catch (error) {
    console.error("Welcome email error:", error);
    return { success: false, error };
  }
};

export const sendSubscriptionSuccessEmail = async (
  email: string,
  name: string,
  planName: string,
  amount: string
) => {
  try {
    const data = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: "Aboneliğiniz Başlatıldı - BerberBot",
      html: await render(SubscriptionEmail({ name, planName, amount, isSuccess: true })),
    });
    return { success: true, data };
  } catch (error) {
    console.error("Subscription success email error:", error);
    return { success: false, error };
  }
};

export const sendSubscriptionFailedEmail = async (
  email: string,
  name: string,
  planName: string,
  reason?: string
) => {
  try {
    const data = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject: "Ödeme Başarısız - BerberBot Aboneliği",
      html: await render(SubscriptionEmail({ name, planName, amount: "", isSuccess: false, reason })),
    });
    return { success: true, data };
  } catch (error) {
    console.error("Subscription failed email error:", error);
    return { success: false, error };
  }
};

export const sendSecurityAlertEmail = async (
  email: string,
  name: string,
  alertType: "password_reset" | "new_login",
  ipAddress?: string,
  resetLink?: string
) => {
  try {
    const subject = alertType === "password_reset" 
      ? "Şifre Sıfırlama Talebi - BerberBot" 
      : "Yeni Cihaz Girişi Uyarı - BerberBot";

    const data = await resend.emails.send({
      from: SENDER_EMAIL,
      to: email,
      subject,
      html: await render(SecurityAlertEmail({ 
        name, 
        alertType, 
        ipAddress, 
        resetLink,
        time: new Date().toLocaleString("tr-TR") 
      })),
    });
    return { success: true, data };
  } catch (error) {
    console.error("Security alert email error:", error);
    return { success: false, error };
  }
};
