// Supabase Auth hata mesajlarının Türkçe karşılıkları
export function authErrorMessage(err: { message?: string; code?: string } | null | undefined): string {
  const msg = (err?.message ?? "").toLowerCase();
  const code = err?.code ?? "";
  if (code === "invalid_credentials" || msg.includes("invalid login credentials")) return "E-posta veya şifre hatalı.";
  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) return "E-posta adresiniz henüz doğrulanmadı.";
  if (code === "user_already_exists" || msg.includes("already registered")) return "Bu e-posta adresiyle zaten bir hesap var.";
  if (code === "otp_expired" || msg.includes("expired") || msg.includes("invalid")) return "Kod hatalı veya süresi dolmuş. Yeni kod isteyin.";
  if (code === "weak_password" || msg.includes("password should")) return "Şifre en az 6 karakter olmalıdır.";
  if (code === "over_email_send_rate_limit" || msg.includes("rate limit")) return "Çok fazla deneme yaptınız. Lütfen birkaç dakika sonra tekrar deneyin.";
  if (msg.includes("network") || msg.includes("fetch")) return "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.";
  return "İşlem başarısız oldu. Lütfen tekrar deneyin.";
}
