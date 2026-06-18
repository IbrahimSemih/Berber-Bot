import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "BerberBot — WhatsApp Randevu Sistemi",
  description: "Berber dükkanınız için WhatsApp üzerinden otomatik randevu sistemi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${syne.variable} ${dmSans.variable} font-dm bg-bg text-txt antialiased`}>
        {children}
      </body>
    </html>
  );
}
