import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import "./globals.css";

const headingFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "BerberBot — WhatsApp Randevu Sistemi",
  description: "Berber dükkanınız için WhatsApp üzerinden otomatik randevu sistemi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${headingFont.variable} ${dmSans.variable} font-dm bg-bg text-txt antialiased`}>
        {children}
      </body>
    </html>
  );
}
