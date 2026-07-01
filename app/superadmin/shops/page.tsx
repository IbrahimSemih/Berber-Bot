import { createAdminClient } from "@/lib/supabase/admin";
import StatusButton from "./StatusButton";

export const dynamic = "force-dynamic";

export default async function ShopsPage() {
  const supabase = createAdminClient();

  const { data: shops } = await supabase
    .from("shops")
    .select("id, name, slug, status, created_at")
    .order("created_at", { ascending: false });

  const { data: appointments } = await supabase.from("appointments").select("shop_id");

  const aptCounts = (appointments || []).reduce((acc: Record<string, number>, apt) => {
    acc[apt.shop_id] = (acc[apt.shop_id] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-10 max-w-6xl w-full mx-auto relative z-10">
      <div className="mb-10">
        <h1 className="text-3xl font-heading font-bold mb-2">Kayıtlı Dükkanlar</h1>
        <p className="text-sm font-medium" style={{ color: "var(--text2)" }}>Sistemdeki tüm berber dükkanlarını yönetin.</p>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: "var(--bg3)", color: "var(--text2)" }}>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b" style={{ borderColor: "var(--border)" }}>Dükkan Bilgisi</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b text-center" style={{ borderColor: "var(--border)" }}>Randevu Hacmi</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b" style={{ borderColor: "var(--border)" }}>Durum</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b" style={{ borderColor: "var(--border)" }}>Kayıt Tarihi</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider border-b text-right" style={{ borderColor: "var(--border)" }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {shops && shops.length > 0 ? (
                shops.map((shop) => (
                  <tr key={shop.id} className="transition-colors hover:bg-white/5 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <td className="px-6 py-5">
                      <div className="font-medium text-base mb-1">{shop.name}</div>
                      <div className="text-xs font-mono" style={{ color: "var(--text3)" }}>/{shop.slug}</div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex items-center justify-center min-w-[40px] px-3 py-1.5 rounded-lg text-sm font-bold" style={{ background: "var(--bg4)", color: "var(--text)" }}>
                        {aptCounts[shop.id] || 0}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold" style={{ 
                        background: shop.status === 'banned' ? 'rgba(255, 95, 87, 0.1)' : 'var(--accent-dim)',
                        color: shop.status === 'banned' ? 'var(--red)' : 'var(--accent)'
                      }}>
                        {shop.status === 'banned' ? 'Askıda (Banlı)' : 'Aktif'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium" style={{ color: "var(--text2)" }}>
                      {new Date(shop.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <StatusButton shopId={shop.id} currentStatus={shop.status || 'active'} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm font-medium" style={{ color: "var(--text3)" }}>
                    Kayıtlı dükkan bulunamadı.
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
