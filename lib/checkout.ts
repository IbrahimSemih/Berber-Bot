// iyzico ödeme formunu başlatır. Bilerek "use server" DEĞİL: Server Action
// olsaydı herkes rastgele shopId ile çağırabilirdi. Sadece oturumu doğrulanmış
// /api/payment/checkout route'u tarafından çağrılır.
import { createCheckoutForm } from "@/lib/iyzico";
import { getPlanPrice, type BillingInterval } from "@/lib/plan-limits";
import { normalizeTrPhone } from "@/lib/validations";
import { SITE } from "@/lib/site-config";

export type BillingProfile = {
  type: "individual" | "corporate";
  full_name: string;
  company_name: string | null;
  identity_number: string | null;
  tax_office: string | null;
  tax_number: string | null;
  phone: string;
  address: string;
  city: string;
  district: string | null;
  zip_code: string | null;
};

/** iyzico'nun beklediği "YYYY-MM-DD HH:mm:ss" biçimi */
function iyzicoDate(value?: string | null) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().replace("T", " ").slice(0, 19);
}

export function isBillingProfileComplete(p: Partial<BillingProfile> | null | undefined): p is BillingProfile {
  if (!p || !p.full_name || !p.phone || !p.address || !p.city) return false;
  if (p.type === "corporate") return !!(p.company_name && p.tax_office && p.tax_number);
  return p.type === "individual" && !!p.identity_number;
}

export async function initiatePayment(params: {
  shopId: string;
  email: string;
  profile: BillingProfile;
  ip: string;
  interval: BillingInterval;
  userCreatedAt?: string | null;
  userLastSignInAt?: string | null;
}) {
  const { shopId, email, profile, ip, interval } = params;
  try {
    const callbackUrl = `${SITE.url}/api/payment/callback`;

    // Şu an sadece PRO plan satılıyor; fiyat tek kaynaktan (PLANS) okunur.
    const price = getPlanPrice("pro", interval).toFixed(2);

    const nameParts = profile.full_name.trim().split(/\s+/);
    const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];

    const address = [profile.address, profile.district, profile.city].filter(Boolean).join(", ");
    const identityNumber = profile.type === "corporate" ? (profile.tax_number as string) : (profile.identity_number as string);

    const result: any = await createCheckoutForm({
      price,
      paidPrice: price,
      // Callback'te dükkanı ve periyodu yakalamak için "<shopId>:<interval>" gönderiyoruz
      basketId: `${shopId}:${interval}`,
      itemId: interval === "yearly" ? "PRO_PLAN_1_YEAR" : "PRO_PLAN_1_MONTH",
      itemName: interval === "yearly" ? "BerberBot Pro Abonelik (1 Yıllık)" : "BerberBot Pro Abonelik (1 Aylık)",
      callbackUrl,
      billingContactName: profile.type === "corporate" && profile.company_name ? profile.company_name : profile.full_name,
      buyer: {
        id: shopId,
        name: firstName,
        surname: lastName,
        gsmNumber: normalizeTrPhone(profile.phone) || profile.phone,
        email,
        identityNumber,
        registrationAddress: address,
        ip,
        city: profile.city,
        country: "Turkey",
        zipCode: profile.zip_code || undefined,
        registrationDate: iyzicoDate(params.userCreatedAt),
        lastLoginDate: iyzicoDate(params.userLastSignInAt),
      },
    });

    if (result.status === "success") {
      return { success: true as const, checkoutFormContent: result.checkoutFormContent as string };
    }
    console.error("Iyzico form başlatma hatası:", result);
    return { success: false as const, error: (result.errorMessage as string) || "Ödeme formu başlatılamadı." };
  } catch (error: any) {
    console.error("Payment init hatası:", error);
    return { success: false as const, error: "Ödeme sistemine şu anda ulaşılamıyor. Lütfen daha sonra tekrar deneyin." };
  }
}
