import { createAdminClient } from "@/lib/supabase/admin";
import { formatTrDateTime } from "@/lib/time";
import InvoiceButton from "./InvoiceButton";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

type Snapshot = {
  type?: string;
  full_name?: string;
  company_name?: string | null;
  identity_number?: string | null;
  tax_office?: string | null;
  tax_number?: string | null;
  phone?: string;
  address?: string;
  district?: string | null;
  city?: string;
} | null;

export default async function InvoicesPage() {
  const supabase = createAdminClient();

  const { data: payments, error } = await supabase
    .from("payments")
    .select("id, shop_id, amount, status, billing_interval, created_at, payment_id, billing_snapshot, invoice_issued_at, invoice_number, shops(name)")
    .in("status", ["success", "refunded"])
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (payments ?? []) as any[];
  const pendingCount = rows.filter((p) => p.status === "success" && !p.invoice_issued_at).length;

  return (
    <div className="p-10 max-w-7xl w-full mx-auto relative z-10">
      <div className="mb-10">
        <h1 className="text-3xl font-heading font-bold mb-2">Faturalar</h1>
        <p className="text-sm font-medium" style={{ color: "var(--text2)" }}>
          Her başarılı ödeme için e-Arşiv / e-Fatura düzenleyin (muhasebe programınızdan), ardından fatura numarasını girip &quot;Kesildi&quot; olarak işaretleyin.
          Fatura bilgileri ödeme anındaki halinden alınmıştır. Bekleyen: <strong>{pendingCount}</strong>
        </p>
      </div>

      {error ? (
        <div className="p-5 rounded-xl border text-sm" style={{ borderColor: "var(--red)", color: "var(--red)" }}>
          Ödemeler okunamadı: {error.message}. Veritabanı güncellemesinin (supabase-schema.sql &gt; &quot;Lansman güncellemesi&quot;) çalıştırıldığından emin olun.
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ background: "var(--bg3)", color: "var(--text2)" }}>
                  {["Tarih / Dükkan", "Tutar", "Fatura Bilgileri", "Durum", "Fatura"].map((h, i) => (
                    <th key={h} className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b ${i === 4 ? "text-right" : ""}`} style={{ borderColor: "var(--border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm" style={{ color: "var(--text3)" }}>Henüz ödeme yok.</td></tr>
                )}
                {rows.map((p) => {
                  const s = p.billing_snapshot as Snapshot;
                  return (
                    <tr key={p.id} className="border-b last:border-0 align-top" style={{ borderColor: "var(--border)" }}>
                      <td className="px-6 py-5">
                        <div className="font-medium">{p.shops?.name ?? "—"}</div>
                        <div className="text-xs mt-1" style={{ color: "var(--text3)" }}>{formatTrDateTime(p.created_at)}</div>
                        <div className="text-[11px] mt-1 font-mono" style={{ color: "var(--text3)" }}>iyzico: {p.payment_id}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-bold">₺{Number(p.amount).toLocaleString("tr-TR")}</div>
                        <div className="text-xs mt-1" style={{ color: "var(--text3)" }}>Pro · {p.billing_interval === "yearly" ? "Yıllık" : "Aylık"}</div>
                      </td>
                      <td className="px-6 py-5 text-xs leading-relaxed" style={{ color: "var(--text2)" }}>
                        {s ? (
                          <>
                            <div className="font-semibold" style={{ color: "var(--text)" }}>
                              {s.type === "corporate" ? s.company_name : s.full_name}
                            </div>
                            {s.type === "corporate" ? (
                              <div>{s.tax_office} V.D. · VKN {s.tax_number} · Yetkili: {s.full_name}</div>
                            ) : (
                              <div>TCKN {s.identity_number}</div>
                            )}
                            <div>{[s.address, s.district, s.city].filter(Boolean).join(", ")}</div>
                            <div>{s.phone}</div>
                          </>
                        ) : (
                          <span style={{ color: "var(--orange)" }}>Fatura bilgisi yok (eski ödeme)</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold" style={{
                          background: p.status === "refunded" ? "rgba(74,158,255,0.12)" : "var(--accent-dim)",
                          color: p.status === "refunded" ? "var(--blue)" : "var(--accent)",
                        }}>
                          {p.status === "refunded" ? "İade edildi" : "Ödendi"}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <InvoiceButton paymentId={p.id} issuedNumber={p.invoice_number ?? (p.invoice_issued_at ? "Kesildi" : null)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
