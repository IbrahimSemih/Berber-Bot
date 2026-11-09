// EXPO_PUBLIC_* değerleri derleme anında pakete gömülür (bkz. mobile/.env.example).
function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`${name} tanımlı değil. mobile/.env.local dosyasını oluşturun (bkz. .env.example).`);
  return value;
}

export const config = {
  supabaseUrl: required("EXPO_PUBLIC_SUPABASE_URL", process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required("EXPO_PUBLIC_SUPABASE_ANON_KEY", process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  apiUrl: (process.env.EXPO_PUBLIC_API_URL || "https://berberbot.com").replace(/\/+$/, ""),
  siteUrl: (process.env.EXPO_PUBLIC_SITE_URL || "https://berberbot.com").replace(/\/+$/, ""),
  // Web'deki lib/site-config.ts → SUPPORT.email ile aynı olmalı
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL || "destek@berberbot.com",
};
