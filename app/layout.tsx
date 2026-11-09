import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { SITE } from "@/lib/site-config";
import "./globals.css";

// Yazı tipleri next/font ile kendi sunucumuzdan sunulur (Google'a istek yok, yazı kayması yok).
// latin-ext: Türkçe karakterler (ğ, ş, ı, İ). Mobil: mobile/src/components/text.tsx aynı aileler.
const headingFont = Fraunces({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
  variable: "--font-heading",
  display: "swap",
});
const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm",
  display: "swap",
});

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
    <html lang="tr" className={`${headingFont.variable} ${bodyFont.variable}`}>
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
