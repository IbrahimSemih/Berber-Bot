"use client";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { AlertTriangle } from "lucide-react";
import { refundPaymentAction } from "./actions";

export default function RefundButton({ paymentId, amount, shopName, outsideWindow }: {
  paymentId: string; amount: number; shopName: string; outsideWindow: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-[var(--red)] w-5 h-5" />
          <span className="font-bold">İadeyi onaylıyor musunuz?</span>
        </div>
        <p className="text-sm">
          <strong>{shopName}</strong> işletmesine ₺{amount.toLocaleString("tr-TR")} iade edilecek ve abonelik hemen sonlandırılacak.
          {outsideWindow && " Dikkat: ödeme iade süresinin dışında."}
        </p>
        <div className="flex justify-end gap-2 mt-2">
          <button className="px-3 py-1.5 text-xs rounded border" onClick={() => toast.dismiss(t.id)}>Vazgeç</button>
          <button className="px-3 py-1.5 text-xs rounded bg-[rgba(185,60,52,0.14)] text-[var(--red)] border border-[rgba(185,60,52,0.3)] hover:bg-[rgba(185,60,52,0.2)]" onClick={async () => {
            toast.dismiss(t.id);
            setLoading(true);
            const result = await refundPaymentAction(paymentId);
            setLoading(false);
            if (result.success) toast.success("İade yapıldı, abonelik sonlandırıldı.");
            else toast.error(result.error || "İade yapılamadı.");
          }}>Evet, İade Et</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  return (
    <button onClick={handleClick} disabled={loading}
      className="px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 hover:-translate-y-0.5"
      style={{ background: "rgba(255, 95, 87, 0.15)", color: "var(--red)" }}>
      {loading ? "İşleniyor..." : "İade Et"}
    </button>
  );
}
