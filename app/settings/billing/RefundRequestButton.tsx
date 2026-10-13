"use client";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { requestRefund } from "./refundActions";

export default function RefundRequestButton({ paymentId, daysLeft }: { paymentId: string; daysLeft: number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const result = await requestRefund(paymentId, reason);
    setLoading(false);
    if (result.success) {
      toast.success("İade talebiniz alındı. En kısa sürede incelenip iade edilecek.");
      setOpen(false);
    } else {
      toast.error(result.error || "İade talebi gönderilemedi.");
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-white/5"
        style={{ borderColor: "var(--border2)", color: "var(--text2)" }}>
        İade Talep Et ({daysLeft} gün kaldı)
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full sm:w-72">
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={3}
        placeholder="İade nedeniniz (isteğe bağlı)"
        className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
        style={{ background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)" }} />
      <div className="flex gap-2">
        <button onClick={submit} disabled={loading}
          className="flex-1 text-xs font-bold px-3 py-2 rounded-lg disabled:opacity-50"
          style={{ background: "var(--accent)", color: "#0a0a0a" }}>
          {loading ? "Gönderiliyor..." : "İade Talebi Gönder"}
        </button>
        <button onClick={() => setOpen(false)} disabled={loading}
          className="text-xs px-3 py-2 rounded-lg border" style={{ borderColor: "var(--border2)", color: "var(--text2)" }}>
          Vazgeç
        </button>
      </div>
      <p className="text-[11px]" style={{ color: "var(--text3)" }}>
        Onaylanırsa ücretin tamamı iade edilir ve aboneliğiniz hemen sona erer.
      </p>
    </div>
  );
}
