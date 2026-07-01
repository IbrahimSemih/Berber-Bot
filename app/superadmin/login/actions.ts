"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginSuperAdmin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const validEmail = process.env.SUPERADMIN_EMAIL;
  const validPassword = process.env.SUPERADMIN_PASSWORD;

  if (!validEmail || !validPassword) {
    return { error: "Sistem yapılandırma hatası: Yönetici bilgileri tanımlanmamış." };
  }

  if (email === validEmail && password === validPassword) {
    cookies().set("superadmin_auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
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
