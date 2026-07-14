"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { signSuperAdminToken } from "@/lib/auth";
import { authLimiter, getIp } from "@/lib/rate-limit";

export async function loginSuperAdmin(formData: FormData) {
  // Rate limiting check
  const ip = getIp(undefined, headers());
  const { success } = await authLimiter.limit(`superadmin_login_${ip}`);
  
  if (!success) {
    return { error: "Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin." };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const validEmail = process.env.SUPERADMIN_EMAIL;
  const validPasswordHash = process.env.SUPERADMIN_PASSWORD_HASH;

  if (!validEmail || !validPasswordHash) {
    return { error: "Sistem yapılandırma hatası: Yönetici bilgileri tanımlanmamış." };
  }

  if (email === validEmail && bcrypt.compareSync(password, validPasswordHash)) {
    const token = await signSuperAdminToken(24 * 7); // 1 week expiration
    
    cookies().set("superadmin_auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/superadmin",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    
    // Redirect must be outside try-catch, or just handled properly.
    // In Server Actions, redirect throws an error that Next.js catches, so don't catch it unless you rethrow.
  } else {
    return { error: "Geçersiz e-posta veya şifre." };
  }

  redirect("/superadmin");
}

export async function logoutSuperAdmin() {
  cookies().delete("superadmin_auth");
  redirect("/superadmin/login");
}
