import type { Metadata } from "next";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getOwnerContext } from "@/lib/owner";
import { SITE } from "@/lib/site-config";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Randevu Afişi · BerberBot",
  robots: { index: false, follow: false },
};

export default async function QrPosterPage() {
  const ctx = await getOwnerContext();
  if (!ctx) redirect("/login");

  const url = `${SITE.url}/${ctx.shop.slug}`;
  const qr = await QRCode.toDataURL(url, { width: 900, margin: 1, errorCorrectionLevel: "M" });

  return (
    <div className="min-h-screen bg-neutral-200 print:bg-white flex items-center justify-center p-6 print:p-0">
      <style>{`@page { size: A4; margin: 0; } @media print { body { background: #fff !important; } }`}</style>
      <div
        className="bg-white text-neutral-900 w-[210mm] min-h-[297mm] flex flex-col items-center justify-between py-[22mm] px-[18mm] shadow-2xl print:shadow-none"
        style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', sans-serif" }}
      >
        <div className="text-center">
          <div className="text-[14pt] font-semibold tracking-[0.3em] uppercase text-neutral-500">Online Randevu</div>
          <h1 className="text-[40pt] font-black leading-tight mt-3">{ctx.shop.name}</h1>
        </div>

        <div className="flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Randevu QR kodu" className="w-[110mm] h-[110mm]" />
          <p className="text-[20pt] font-bold mt-6 text-center">Telefonunuzun kamerasıyla okutun,<br />randevunuzu hemen alın.</p>
        </div>

        <div className="text-center">
          <div className="text-[16pt] font-semibold break-all">{url.replace(/^https?:\/\//, "")}</div>
          <div className="text-[11pt] text-neutral-500 mt-3">Onay ve hatırlatma mesajları WhatsApp ile gelir · BerberBot</div>
        </div>
      </div>
      <PrintButton />
    </div>
  );
}
