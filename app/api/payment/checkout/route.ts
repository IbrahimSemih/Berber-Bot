import { NextRequest, NextResponse } from "next/server";
import { initiatePayment } from "@/app/settings/billing/actions";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
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
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (!shop) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  const result = await initiatePayment(shop.id, user.email || "", shop.name);

  if (result.success && result.checkoutFormContent) {
    const html = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Güvenli Ödeme - BerberBot</title>
      </head>
      <body>
        <div style="display:flex; justify-content:center; padding: 50px; font-family: sans-serif;">
          Yönlendiriliyorsunuz...
        </div>
        ${result.checkoutFormContent}
        <div id="iyzipay-checkout-form" class="responsive"></div>
      </body>
      </html>
    `;
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } else {
    return NextResponse.redirect(new URL(`/settings/billing?error=${encodeURIComponent(result.error || "")}`, req.url));
  }
}
