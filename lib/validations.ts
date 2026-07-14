import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır."),
});

export const signupSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır."),
  passwordConfirm: z.string().min(6, "Şifre (Tekrar) en az 6 karakter olmalıdır."),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Şifreler birbiriyle eşleşmiyor.",
  path: ["passwordConfirm"],
});

export const bookingSchema = z.object({
  customerName: z.string().min(2, "Lütfen adınızı tam olarak giriniz."),
  // Sadece rakamlara izin ver ve boşlukları silip formatı kontrol et
  phone: z.string()
    .transform((val) => val.replace(/\D/g, "")) // Sadece rakamları al
    .refine((val) => val.length >= 10 && val.length <= 12, {
      message: "Lütfen geçerli bir telefon numarası giriniz (örn: 5551234567)",
    }),
});
