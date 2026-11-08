import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import { SITE } from "@/lib/site-config";
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
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
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
                secondary: '#0a0a0a',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
