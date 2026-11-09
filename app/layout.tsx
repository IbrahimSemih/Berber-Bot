import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import { SITE } from "@/lib/site-config";
// Yazı tipleri npm paketinden kendi sunucumuzdan sunulur (build Google'a bağlı değil;
// next/font/google, Next 14'te bazı Google font adreslerini çözemeyip build'i kırıyordu).
// Alt kümeler unicode-range ile: tarayıcı yalnızca gerekeni (latin / latin-ext → Türkçe) indirir.
// Mobil: mobile/src/lib/fonts.ts aynı aileler ve ağırlıklar.
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/700.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "BerberBot — Berberler için Online Randevu ve WhatsApp Bildirimleri",
  description:
    "Berber ve erkek kuaförleri için online randevu sayfası. Müşterileriniz 7/24 randevu alsın; onay, hatırlatma ve iptal mesajları WhatsApp'tan otomatik gitsin.",
  applicationName: "BerberBot",
  keywords: ["berber randevu sistemi", "kuaför randevu programı", "online randevu", "whatsapp randevu hatırlatma", "berber yazılımı"],
  openGraph: {
    title: "BerberBot — Online Randevu ve WhatsApp Bildirimleri",
    description: "Berberler için online randevu sayfası, WhatsApp onay ve hatırlatma mesajları.",
    url: SITE.url,
    siteName: "BerberBot",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BerberBot — Online Randevu ve WhatsApp Bildirimleri",
    description: "Berberler için online randevu sayfası, WhatsApp onay ve hatırlatma mesajları.",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="font-dm bg-bg text-txt antialiased">
        {children}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            },
            success: {
              iconTheme: {
                primary: 'var(--accent)',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
