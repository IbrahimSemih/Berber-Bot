import { z } from "zod";

export const PHONE_ERROR = "Lütfen geçerli bir cep telefonu numarası giriniz (örn: 532 123 45 67).";

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
  customerName: z.string().trim().min(2, "Lütfen adınızı tam olarak giriniz.").max(80, "Ad soyad en fazla 80 karakter olabilir."),
  // Türkiye cep telefonu; "+905XXXXXXXXX" biçimine çevrilir
  phone: z.string()
    .refine((val) => normalizeTrPhone(val) !== null, { message: PHONE_ERROR })
    .transform((val) => normalizeTrPhone(val) as string),
});

/**
 * Türkiye cep telefonu numarasını E.164 biçimine çevirir: "+905321234567".
 * Kabul edilen girişler: "5321234567", "05321234567", "905321234567",
 * "+90 532 123 45 67" vb. Geçersizse null döner.
 */
export function normalizeTrPhone(raw: string): string | null {
  let digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (digits.length !== 10 || !digits.startsWith("5")) return null;
  return `+90${digits}`;
}

/** Aynı numaranın veritabanında eski biçimlerle kayıtlı olabileceği varyantlar */
export function phoneLookupVariants(raw: string): string[] {
  const normalized = normalizeTrPhone(raw);
  const variants = new Set<string>([raw.trim()]);
  if (normalized) {
    const local = normalized.slice(3); // 5XXXXXXXXX
    variants.add(normalized);
    variants.add(local);
    variants.add(`0${local}`);
    variants.add(`90${local}`);
  }
  return Array.from(variants).filter(Boolean);
}


/** T.C. Kimlik No algoritma kontrolü */
export function isValidTcKimlik(value: string): boolean {
  if (!/^[1-9]\d{10}$/.test(value)) return false;
  const d = value.split("").map(Number);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  const d10 = ((odd * 7 - even) % 10 + 10) % 10;
  if (d10 !== d[9]) return false;
  const d11 = d.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
  return d11 === d[10];
}

/** Vergi Kimlik No (10 hane) algoritma kontrolü */
export function isValidVkn(value: string): boolean {
  if (!/^\d{10}$/.test(value)) return false;
  const digits = value.split("").map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const tmp = (digits[i] + (9 - i)) % 10;
    let v = (tmp * Math.pow(2, 9 - i)) % 9;
    if (tmp !== 0 && v === 0) v = 9;
    sum += v;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === digits[9];
}

export const billingProfileSchema = z
  .object({
    type: z.enum(["individual", "corporate"]),
    full_name: z.string().trim().min(3, "Ad soyad en az 3 karakter olmalıdır.").max(120),
    company_name: z.string().trim().max(200).optional().default(""),
    identity_number: z.string().trim().optional().default(""),
    tax_office: z.string().trim().max(120).optional().default(""),
    tax_number: z.string().trim().optional().default(""),
    phone: z.string().trim(),
    address: z.string().trim().min(10, "Lütfen açık adresinizi giriniz.").max(400),
    city: z.string().trim().min(2, "İl bilgisi zorunludur.").max(60),
    district: z.string().trim().max(60).optional().default(""),
    zip_code: z.string().trim().max(10).optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (!normalizeTrPhone(data.phone)) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: PHONE_ERROR });
    }
    if (data.type === "individual") {
      if (!isValidTcKimlik(data.identity_number)) {
        ctx.addIssue({ code: "custom", path: ["identity_number"], message: "Geçerli bir T.C. Kimlik Numarası giriniz." });
      }
    } else {
      if (data.company_name.length < 2) {
        ctx.addIssue({ code: "custom", path: ["company_name"], message: "Şirket unvanı zorunludur." });
      }
      if (data.tax_office.length < 2) {
        ctx.addIssue({ code: "custom", path: ["tax_office"], message: "Vergi dairesi zorunludur." });
      }
      if (!isValidVkn(data.tax_number)) {
        ctx.addIssue({ code: "custom", path: ["tax_number"], message: "Geçerli bir 10 haneli Vergi Kimlik Numarası giriniz." });
      }
    }
  });

export type BillingProfileInput = z.input<typeof billingProfileSchema>;

/** "@berber", "instagram.com/berber/", "https://www.instagram.com/berber?x=1" → "berber" */
export function instagramHandle(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let v = value.trim();
  if (!v) return null;
  v = v.replace(/^https?:\/\//i, "").replace(/^(www\.)?instagram\.com\//i, "");
  v = v.split(/[/?#]/)[0].replace(/^@/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(v) ? v : null;
}
