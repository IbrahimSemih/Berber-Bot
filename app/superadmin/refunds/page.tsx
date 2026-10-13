import { createAdminClient } from "@/lib/supabase/admin";
import { YEARLY_REFUND_DAYS } from "@/lib/plan-limits";
import RefundButton from "./RefundButton";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function RefundsPage() {
  const supabase = createAdminClient();

  const { data: payments } = await supabase
    .from("payments")
    .select("id, shop_id, amount, status, billing_interval, created_at, refund_requested_at, refund_reason, refunded_at, shops(name)")
    .in("status", ["success", "refunded"])
    .order("refund_requested_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (payments ?? []).map((p: any) => ({ ...p, shopName: p.shops?.name ?? "—" }));
  const pending = rows.filter((p) => p.status === "success" && p.refund_requested_at);
  const others = rows.filter((p) => !(p.status === "success" && p.refund_requested_at));
  const now = Date.now();

  const renderRow = (p: any) => {
    const ageDays = (now - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const outsideWindow = ageDays > YEARLY_REFUND_DAYS;
    return (
      <tr key={p.id} className="border-b last:border-0 transition-colors hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
        <td className="px-6 py-5">
          <div className="font-medium">{p.shopName}</div>
          <div className="text-xs mt-1" style={{ color: "var(--text3)" }}>
            {p.billing_interval === "yearly" ? "Yıllık" : "Aylık"} · {new Date(p.created_at).toLocaleDateString("tr-TR")} ({Math.floor(ageDays)}. gün)
          </div>
        </td>
        <td className="px-6 py-5 font-bold">₺{Number(p.amount).toLocaleString("tr-TR")}</td>
        <td className="px-6 py-5 text-sm max-w-xs" style={{ color: "var(--text2)" }}>
          {p.refund_requested_at ? (
            <>
              <div className="text-xs font-bold mb-1" style={{ color: "var(--orange)" }}>
                Talep: {new Date(p.refund_requested_at).toLocaleDateString("tr-TR")}
              </div>
              {p.refund_reason || <span style={{ color: "var(--text3)" }}>Neden belirtilmedi</span>}
            </>
          ) : "—"}
        </td>
        <td className="px-6 py-5">
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold" style={{
            background: p.status === "refunded" ? "rgba(74,158,255,0.12)" : "var(--accent-dim)",
            color: p.status === "refunded" ? "var(--blue)" : "var(--accent)",
          }}>
            {p.status === "refunded" ? `İade edildi${p.refunded_at ? " · " + new Date(p.refunded_at).toLocaleDateString("tr-TR") : ""}` : "Ödendi"}
          </span>
        </td>
        <td className="px-6 py-5 text-right">
          {p.status === "success" && (
            <RefundButton paymentId={p.id} amount={Number(p.amount)} shopName={p.shopName} outsideWindow={outsideWindow} />
          )}
        </td>
      </tr>
    );
  };

  const Table = ({ title, items, empty }: { title: string; items: any[]; empty: string }) => (
    <div className="mb-10">
      <h2 className="text-lg font-heading font-bold mb-3">{title} <span className="text-sm font-medium" style={{ color: "var(--text3)" }}>({items.length})</span></h2>
      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: "var(--bg3)", color: "var(--text2)" }}>
                {["Dükkan", "Tutar", "Talep", "Durum", "İşlem"].map((h, i) => (
                  <th key={h} className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b ${i === 4 ? "text-right" : ""}`} style={{ borderColor: "var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? items.map(renderRow) : (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-sm" style={{ color: "var(--text3)" }}>{empty}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-10 max-w-6xl w-full mx-auto relative z-10">
      <div className="mb-10">
        <h1 className="text-3xl font-heading font-bold mb-2">İadeler</h1>
        <p className="text-sm font-medium" style={{ color: "var(--text2)" }}>
          İşletmelerin iade taleplerini inceleyin ve iyzico üzerinden iade edin. Yıllık planlarda iade süresi {YEARLY_REFUND_DAYS} gündür.
        </p>
      </div>
      <Table title="Bekleyen İade Talepleri" items={pending} empty="Bekleyen iade talebi yok." />
      <Table title="Tüm Ödemeler" items={others} empty="Ödeme kaydı bulunamadı." />
    </div>
  );
}
