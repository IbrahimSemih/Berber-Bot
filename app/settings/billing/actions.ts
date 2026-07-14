"use server";

import { createCheckoutForm } from "@/lib/iyzico";

export async function initiatePayment(shopId: string, email: string, name: string) {
  try {
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback`;
    
    // İyzico isim ve soyismi ayrı ister, basitçe bölüyoruz
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || 'BerberBot';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Kullanıcısı';

    const result: any = await createCheckoutForm({
      price: "299.00",
      paidPrice: "299.00",
      basketId: shopId, // Webhook'ta yakalamak için dükkan id'sini basketId olarak gönderiyoruz
      callbackUrl,
      buyer: {
        id: shopId,
        name: firstName,
        surname: lastName,
        gsmNumber: "+905555555555", // Gerçek sistemde kullanıcıdan alınmalı
        email: email,
        identityNumber: "11111111111", // İyzico zorunlu tutuyor
        registrationAddress: "BerberBot Sanal Adres",
        ip: "85.34.78.112", // Gerçekte headers'dan alınmalı
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
