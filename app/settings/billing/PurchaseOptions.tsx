"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { PLANS, YEARLY_REFUND_DAYS } from "@/lib/plan-limits";

export default function PurchaseOptions({ profileComplete }: { profileComplete: boolean }) {
  const [accepted, setAccepted] = useState(false);
  const enabled = profileComplete && accepted;

  const href = (interval: "monthly" | "yearly") => `/api/payment/checkout?interval=${interval}&consent=1`;
  const disabledStyle = enabled ? {} : { opacity: 0.45, pointerEvents: "none" as const };

  return (
    <div className="mt-auto">
      {!profileComplete && (
        <p className="text-xs mb-3 p-3 rounded-lg" style={{ background: "rgba(255,170,51,0.1)", color: "var(--orange)" }}>
          Ödeme yapabilmek için önce aşağıdaki <a href="#fatura" className="underline font-semibold">Fatura Bilgileri</a> bölümünü doldurun.
        </p>
      )}

      <label className="flex items-start gap-2.5 text-xs leading-relaxed mb-4 cursor-pointer" style={{ color: "var(--text2)" }}>
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 w-4 h-4 flex-shrink-0 accent-[var(--accent)]" />
        <span>
          <Link href="/on-bilgilendirme-formu" target="_blank" className="underline" style={{ color: "var(--accent)" }}>Ön Bilgilendirme Formu</Link>
          &apos;nu ve{" "}
          <Link href="/mesafeli-satis-sozlesmesi" target="_blank" className="underline" style={{ color: "var(--accent)" }}>Mesafeli Satış Sözleşmesi</Link>
          &apos;ni okudum, onaylıyorum.{" "}
          <Link href="/iptal-ve-iade" target="_blank" className="underline">İptal ve iade koşulları</Link>
        </span>
      </label>

      <a href={href("yearly")} aria-disabled={!enabled} style={{ background: "var(--accent)", color: "#0a0a0a", ...disabledStyle }}
        className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg text-center">
        <Zap className="w-4 h-4" />
        Yıllık ₺{PLANS.pro.yearlyPrice.toLocaleString("tr-TR")} · 2 ay bedava
      </a>
      <p className="text-[11px] text-center mt-2" style={{ color: "var(--text2)" }}>
        İlk {YEARLY_REFUND_DAYS} gün koşulsuz iade
      </p>
      <a href={href("monthly")} aria-disabled={!enabled} style={{ borderColor: "var(--border2)", color: "var(--text2)", ...disabledStyle }}
        className="w-full py-3 mt-3 rounded-xl text-sm font-medium block text-center border transition-colors hover:bg-white/5">
        Aylık ₺{PLANS.pro.price.toLocaleString("tr-TR")} / Ay
      </a>
      <p className="text-[10px] text-center mt-3 opacity-60">
        Fiyatlara KDV dahildir · Ödemeler iyzico güvencesiyle alınır · Otomatik yenileme yoktur
      </p>
    </div>
  );
}
