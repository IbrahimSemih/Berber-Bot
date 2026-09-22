"use server";

import { createCheckoutForm } from "@/lib/iyzico";
import { PLANS } from "@/lib/plan-limits";

export async function initiatePayment(shopId: string, email: string, name: string, ip: string = "85.34.78.112") {
  try {
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback`;

    // Şu an sadece PRO plana yükseltme akışı destekleniyor; fiyat tek kaynaktan (PLANS) okunur.
    const price = PLANS.pro.price.toFixed(2);

    // İyzico isim ve soyismi ayrı ister, basitçe bölüyoruz
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || 'BerberBot';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Kullanıcısı';

    const result: any = await createCheckoutForm({
      price,
      paidPrice: price,
      basketId: shopId, // Webhook'ta yakalamak için dükkan id'sini basketId olarak gönderiyoruz
      callbackUrl,
      buyer: {
        id: shopId,
        name: firstName,
        surname: lastName,
        gsmNumber: "+905555555555", // TODO: gerçek sistemde kullanıcıdan alınmalı (henüz formda toplanmıyor)
        email: email,
        identityNumber: "11111111111", // TODO: İyzico zorunlu tutuyor, gerçek TC kimlik no toplanmıyor
        registrationAddress: "BerberBot Sanal Adres",
        ip,
        city: "Istanbul",
        country: "Turkey",
        zipCode: "34000"
      }
    });

    if (result.status === "success") {
      return { success: true, checkoutFormContent: result.checkoutFormContent };
    } else {
      console.error("Iyzico form başlatma hatası:", result);
      return { success: false, error: result.errorMessage || "Ödeme formu başlatılamadı." };
    }
  } catch (error: any) {
    console.error("Payment init hatası:", error);
    return { success: false, error: error.message };
  }
}
