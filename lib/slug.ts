// Dükkan randevu linki (berberbot.com/<slug>) için kurallar.
// Uygulamadaki her üst seviye rota burada olmalı: aksi halde o rotayla aynı
// slug'ı alan dükkanın sayfası açılmaz (statik rota önceliklidir).
export const RESERVED_SLUGS = new Set([
  // mevcut rotalar
  "analytics", "api", "appointments", "auth", "banned", "customers", "dashboard",
  "forgot-password", "gizlilik", "kullanim-kosullari", "login", "notifications",
  "onboarding", "profile", "r", "rehber", "reset-password", "settings", "signup",
  "staff", "superadmin", "iletisim", "hakkimizda", "mesafeli-satis-sozlesmesi",
  "on-bilgilendirme-formu", "iptal-ve-iade", "aydinlatma-metni",
  // Next.js / statik dosyalar
  "_next", "robots.txt", "sitemap.xml", "icon", "icon.svg", "apple-icon",
  "opengraph-image", "twitter-image", "manifest.webmanifest", "favicon.ico",
  // ileride kullanılabilecek / karıştırılabilecek adresler
  "whatsapp", "admin", "www", "blog", "yardim", "destek", "fiyatlar", "fiyat",
  "demo", "iletişim", "kayit", "giris", "panel", "app", "berberbot", "static",
  "public", "assets", "help", "support", "pricing", "about", "contact", "terms",
  "privacy", "kvkk",
]);

export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 40;

const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", I: "i", İ: "i", ö: "o", Ö: "o",
  ş: "s", Ş: "s", ü: "u", Ü: "u", â: "a", Â: "a", î: "i", Î: "i", û: "u", Û: "u",
};

/** "Şükrü'nün Berber Salonu" → "sukrunun-berber-salonu" */
export function slugify(input: string): string {
  return input
    .replace(/[çÇğĞıIİöÖşŞüÜâÂîÎûÛ]/g, (ch) => TR_MAP[ch] ?? ch)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");
}

/** Geçerliyse null, değilse kullanıcıya gösterilecek hata mesajı döner. */
export function validateSlug(slug: string): string | null {
  if (slug.length < SLUG_MIN_LENGTH) return `Link en az ${SLUG_MIN_LENGTH} karakter olmalıdır.`;
  if (slug.length > SLUG_MAX_LENGTH) return `Link en fazla ${SLUG_MAX_LENGTH} karakter olabilir.`;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "Link yalnızca küçük harf (a-z), rakam ve tire (-) içerebilir; tire ile başlayıp bitemez.";
  }
  if (RESERVED_SLUGS.has(slug)) return "Bu link sistem tarafından kullanılıyor, lütfen başka bir link seçin.";
  return null;
}
