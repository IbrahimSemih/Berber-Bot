"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { setInvoiceIssued } from "./actions";

export default function InvoiceButton({ paymentId, issuedNumber }: { paymentId: string; issuedNumber: string | null }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function save(number: string | null) {
    setLoading(true);
    const result = await setInvoiceIssued(paymentId, number);
    setLoading(false);
    if (result.success) toast.success(number ? "Fatura kesildi olarak işaretlendi." : "Fatura işareti kaldırıldı.");
    else toast.error(result.error || "Güncellenemedi.");
  }

  if (issuedNumber) {
    return (
      <div className="flex items-center gap-2 justify-end">
        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
          {issuedNumber}
        </span>
        <button disabled={loading} onClick={() => save(null)} className="text-xs underline" style={{ color: "var(--text3)" }}>Geri al</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Fatura no"
        className="w-32 px-2 py-1.5 rounded-lg text-xs outline-none"
        style={{ background: "var(--bg)", border: "1px solid var(--border2)", color: "var(--text)" }}
      />
      <button
        disabled={loading || !value.trim()}
        onClick={() => save(value)}
        className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
        style={{ background: "var(--accent)", color: "var(--on-accent)" }}
      >
        Kesildi
      </button>
    </div>
  );
}
