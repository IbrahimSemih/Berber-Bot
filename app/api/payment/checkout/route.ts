import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseBillingInterval } from "@/lib/plan-limits";
import { initiatePayment, isBillingProfileComplete } from "@/lib/checkout";
import { apiLimiter, getIp } from "@/lib/rate-limit";
import { SITE } from "@/lib/site-config";
import { isWebBillingEnabled } from "@/lib/billing-config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Yönlendirmeler NEXT_PUBLIC_APP_URL üzerinden (ngrok/proxy arkasında req.url hatalı olabiliyor)
  const base = process.env.NEXT_PUBLIC_APP_URL ? SITE.url : req.nextUrl.origin;
  const billingRedirect = (error: string) =>
    NextResponse.redirect(new URL(`/settings/billing?error=${encodeURIComponent(error)}#plans`, base));

  // Web'de satış kapalıyken (abonelik mobil uygulamadan alınır) iyzico ödemesi başlatılmaz
  if (!isWebBillingEnabled()) return billingRedirect("billing_disabled");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", base));
  }

  const { success: allowed } = await apiLimiter.limit(`checkout_${user.id}`);
  if (!allowed) return billingRedirect("too_many_requests");

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, status")
    .eq("owner_id", user.id)
    .single();

  if (!shop) {
    return NextResponse.redirect(new URL("/onboarding", base));
  }
  if (shop.status === "banned") {
    return NextResponse.redirect(new URL("/banned", base));
  }

  // Mesafeli satış sözleşmesi ve ön bilgilendirme formu onayı zorunlu
  if (req.nextUrl.searchParams.get("consent") !== "1") {
    return billingRedirect("consent_required");
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("billing_profiles")
    .select("*")
    .eq("shop_id", shop.id)
    .maybeSingle();

  if (profileError) {
    console.error("Fatura bilgileri okunamadı:", profileError);
    return billingRedirect("billing_profile_unavailable");
  }
  if (!isBillingProfileComplete(profile)) {
    return billingRedirect("billing_profile_required");
  }

  await admin
    .from("billing_profiles")
    .update({ contract_accepted_at: new Date().toISOString() })
    .eq("shop_id", shop.id);

  const interval = parseBillingInterval(req.nextUrl.searchParams.get("interval"));

  const result = await initiatePayment({
    shopId: shop.id,
    email: user.email || "",
    profile,
    ip: getIp(req),
    interval,
    userCreatedAt: user.created_at,
    userLastSignInAt: user.last_sign_in_at,
  });

  if (result.success && result.checkoutFormContent) {
    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex">
  <title>Güvenli Ödeme - BerberBot</title>
</head>
<body>
  <div style="display:flex; justify-content:center; padding: 50px; font-family: sans-serif;">
    Güvenli ödeme sayfasına yönlendiriliyorsunuz...
  </div>
  ${result.checkoutFormContent}
  <div id="iyzipay-checkout-form" class="responsive"></div>
</body>
</html>`;
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  return billingRedirect(result.success ? "Ödeme formu başlatılamadı." : result.error);
}
