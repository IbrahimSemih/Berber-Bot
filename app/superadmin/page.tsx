import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboard() {
  const supabase = createAdminClient();

  const { count: totalShops } = await supabase.from("shops").select("*", { count: "exact", head: true });
  const { count: totalAppointments } = await supabase.from("appointments").select("*", { count: "exact", head: true });
  const { data: recentShops } = await supabase.from("shops").select("id, name, created_at, status").order("created_at", { ascending: false }).limit(5);

  const estimatedMRR = (totalShops || 0) * 290;

  return (
    <div className="p-10 max-w-6xl w-full mx-auto relative z-10">
      <div className="mb-10">
        <h1 className="text-3xl font-heading font-bold mb-2">Genel Bakış</h1>
        <p className="text-sm font-medium" style={{ color: "var(--text2)" }}>Sistemin genel istatistikleri ve son durum özeti.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Stat Cards */}
        {[
          { label: "Toplam Dükkan", value: totalShops || 0, icon: "🏪" },
          { label: "Toplam Randevu", value: totalAppointments || 0, icon: "📅" },
          { label: "Tahmini MRR (Aylık)", value: `${estimatedMRR.toLocaleString("tr-TR")} ₺`, icon: "💰", accent: true }
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl border relative overflow-hidden group" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "var(--bg3)" }}>{stat.icon}</div>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text3)" }}>{stat.label}</div>
            <div className="text-4xl font-heading font-black" style={{ color: stat.accent ? "var(--accent)" : "var(--text)" }}>{stat.value}</div>
            {stat.accent && <div className="text-[10px] mt-2 font-medium" style={{ color: "var(--text3)" }}>Dükkan başı 290₺ üzerinden</div>}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-heading font-bold text-lg">Son Eklenen Dükkanlar</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: "var(--bg3)", color: "var(--text2)" }}>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b" style={{ borderColor: "var(--border)" }}>Dükkan Adı</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b" style={{ borderColor: "var(--border)" }}>Durum</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b" style={{ borderColor: "var(--border)" }}>Kayıt Tarihi</th>
              </tr>
            </thead>
            <tbody>
              {recentShops && recentShops.length > 0 ? (
                recentShops.map((shop) => (
                  <tr key={shop.id} className="transition-colors hover:bg-white/5 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <td className="px-6 py-5 text-sm font-medium">{shop.name}</td>
                    <td className="px-6 py-5 text-sm">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold" style={{ 
                        background: shop.status === 'banned' ? 'rgba(255, 95, 87, 0.1)' : 'var(--accent-dim)',
                        color: shop.status === 'banned' ? 'var(--red)' : 'var(--accent)'
                      }}>
                        {shop.status === 'banned' ? 'Banlı' : 'Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium" style={{ color: "var(--text2)" }}>
                      {new Date(shop.created_at).toLocaleDateString("tr-TR")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-sm font-medium" style={{ color: "var(--text3)" }}>
                    Henüz kayıtlı dükkan yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
