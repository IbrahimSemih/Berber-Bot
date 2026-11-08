// Şirket ve iletişim bilgileri: yasal sayfalar (gizlilik, mesafeli satış,
// ön bilgilendirme, iade, aydınlatma metni), iletişim sayfası ve footer
// buradan okunur.
//
// ⚠️ CANLIYA ÇIKMADAN ÖNCE köşeli parantezli [ ... ] alanların hepsini gerçek
// bilgilerle doldurun. Mesafeli Sözleşmeler Yönetmeliği, KVKK ve iyzico üye
// işyeri başvurusu bu bilgilerin sitede açıkça yazmasını şart koşar.

export const SITE = {
  name: "BerberBot",
  url: (process.env.NEXT_PUBLIC_APP_URL || "https://berberbot.com").trim().replace(/\/$/, ""),
  tagline: "Berberler için online randevu sayfası ve WhatsApp bildirimleri",
};

export const COMPANY = {
  /** Ticaret unvanı veya şahıs şirketiyse ad soyad */
  legalName: "[Şirket Unvanı]",
  /** Açık adres */
  address: "[Açık Adres, İlçe / İl]",
  taxOffice: "[Vergi Dairesi]",
  taxNumber: "[Vergi Kimlik No]",
  /** Şahıs şirketlerinde MERSİS yoksa boş bırakılabilir */
  mersisNo: "",
  phone: "[Telefon]",
  email: "destek@berberbot.com",
  kvkkEmail: "kvkk@berberbot.com",
  /** KEP adresi varsa yazın, yoksa boş bırakın */
  kepAddress: "",
};

export const SUPPORT = {
  email: COMPANY.email,
  /**
   * Panelde "WhatsApp Destek" butonu için numara (ülke koduyla, sadece rakam).
   * Örn: "905321234567". Boş bırakılırsa buton gösterilmez.
   */
  whatsappNumber: "",
  /** Destek ekibine ulaşılabilecek saatler (iletişim sayfasında gösterilir) */
  hours: "Hafta içi 09:00 – 18:00",
};

/** Yasal metinlerdeki "son güncelleme" tarihi */
export const LEGAL_LAST_UPDATED = "5 Kasım 2026";

export function supportWhatsappLink(message = "Merhaba, BerberBot hakkında destek almak istiyorum.") {
  if (!SUPPORT.whatsappNumber) return null;
  return `https://wa.me/${SUPPORT.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
