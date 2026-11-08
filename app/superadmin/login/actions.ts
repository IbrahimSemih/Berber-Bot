"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { signSuperAdminToken, SUPERADMIN_SESSION_HOURS } from "@/lib/auth";
import { authLimiter, getIp } from "@/lib/rate-limit";

/** Sabit sürede karşılaştırma (uzunluk farkı da sızmasın diye özetler karşılaştırılır) */
function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * SUPERADMIN_PASSWORD_HASH (bcrypt) tanımlıysa o kullanılır; yoksa düz
 * SUPERADMIN_PASSWORD ile sabit sürede karşılaştırılır.
 * Hash üretmek için: node -e "console.log(require('bcryptjs').hashSync('SIFRE', 12))"
 */
async function verifyPassword(input: string) {
  const hash = process.env.SUPERADMIN_PASSWORD_HASH;
  if (hash) return bcrypt.compare(input, hash);
  const plain = process.env.SUPERADMIN_PASSWORD;
  return plain ? safeEqual(input, plain) : false;
}

export async function loginSuperAdmin(formData: FormData) {
  // Rate limiting check
  const ip = getIp(undefined, headers());
  const { success } = await authLimiter.limit(`superadmin_login_${ip}`);

  if (!success) {
    return { error: "Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin." };
  }

  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  const validEmail = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const hasPassword = !!(process.env.SUPERADMIN_PASSWORD_HASH || process.env.SUPERADMIN_PASSWORD);

  if (!validEmail || !hasPassword) {
    return { error: "Sistem yapılandırma hatası: Yönetici bilgileri tanımlanmamış." };
  }

  // İki kontrol de her zaman çalışır; hangisinin yanlış olduğu süreden anlaşılmasın
  const emailOk = safeEqual(email, validEmail);
  const passwordOk = await verifyPassword(password);

  if (!emailOk || !passwordOk) {
    return { error: "Geçersiz e-posta veya şifre." };
  }

  const token = await signSuperAdminToken(SUPERADMIN_SESSION_HOURS);

  cookies().set("superadmin_auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/superadmin",
    maxAge: SUPERADMIN_SESSION_HOURS * 60 * 60,
  });

  // redirect() hata fırlatarak çalışır; try/catch içine alınmamalı
  redirect("/superadmin");
}

export async function logoutSuperAdmin() {
  cookies().delete("superadmin_auth");
  redirect("/superadmin/login");
}
