import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Check, AlertTriangle, CreditCard, Clock } from "lucide-react";

export default async function BillingPage({ searchParams }: { searchParams: { success?: string, error?: string } }) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!shop) {
    redirect("/onboarding");
  }

  const isTrialing = shop.subscription_status === 'trialing';
  const isActive = shop.subscription_status === 'active';
  
  const trialEnd = shop.trial_end ? new Date(shop.trial_end) : null;
  const currentPeriodEnd = shop.current_period_end ? new Date(shop.current_period_end) : null;
  const now = new Date();

  const isTrialExpired = isTrialing && trialEnd && trialEnd < now;
  const isActiveExpired = isActive && currentPeriodEnd && currentPeriodEnd < now;
  
  const isLocked = (!isActive && !isTrialing) || isTrialExpired || isActiveExpired;

  // Format dates safely
  const formatDate = (date: Date | null) => {
    if (!date) return "Belirsiz";
    return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Abonelik ve Fatura</h1>
        <p style={{ color: "var(--text2)" }}>
          Dükkanınızın abonelik durumunu ve ödemelerinizi buradan yönetebilirsiniz.
        </p>
      </div>

      {searchParams.success && (
        <div className="p-4 rounded-xl flex items-center gap-3 border" style={{ background: "rgba(34, 197, 94, 0.1)", borderColor: "rgba(34, 197, 94, 0.2)", color: "#22c55e" }}>
          <Check className="w-5 h-5" />
          <p className="font-medium">Ödemeniz başarıyla alındı. PRO plana yükseltildiniz!</p>
        </div>
      )}

      {searchParams.error && (
        <div className="p-4 rounded-xl flex items-center gap-3 border" style={{ background: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}>
          <AlertTriangle className="w-5 h-5" />
          <p className="font-medium">Ödeme işlemi başarısız: {searchParams.error === 'payment_failed' ? 'Kart reddedildi veya bakiye yetersiz.' : searchParams.error}</p>
        </div>
      )}

      {isLocked && (
        <div className="p-5 rounded-xl border bg-red-500/10 border-red-500/20 text-red-500">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="font-bold text-lg">Erişiminiz Kısıtlandı</h3>
          </div>
          <p className="text-sm">
            {isTrialExpired ? "7 Günlük ücretsiz deneme süreniz dolmuştur." : "Abonelik süreniz dolmuştur."} Sisteme tekrar erişebilmek ve randevularınızı yönetmeye devam edebilmek için lütfen PRO plana geçiş yapın.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Plan Card */}
        <div className="p-6 rounded-2xl border" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text3)" }}>Mevcut Planınız</p>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {isActive ? "BerberBot PRO" : "BerberBot Trial"}
                {isActive && <span className="px-2 py-1 text-[10px] uppercase rounded-full bg-green-500/20 text-green-500 tracking-wider">Aktif</span>}
                {isTrialing && !isTrialExpired && <span className="px-2 py-1 text-[10px] uppercase rounded-full bg-blue-500/20 text-blue-500 tracking-wider">Deneme Sürümü</span>}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--bg3)" }}>
              {isActive ? <Check className="w-6 h-6 text-green-500" /> : <Clock className="w-6 h-6 text-blue-500" />}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between pb-4 border-b" style={{ borderColor: "var(--border)" }}>
              <span style={{ color: "var(--text2)" }}>Durum</span>
              <span className="font-medium">
                {isLocked ? <span className="text-red-500">Süresi Doldu</span> : "Kullanıma Açık"}
              </span>
            </div>
            <div className="flex justify-between pb-4 border-b" style={{ borderColor: "var(--border)" }}>
              <span style={{ color: "var(--text2)" }}>{isActive ? "Sonraki Fatura Tarihi" : "Deneme Bitiş Tarihi"}</span>
              <span className="font-medium">
                {isActive ? formatDate(currentPeriodEnd) : formatDate(trialEnd)}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--text2)" }}>Fiyatlandırma</span>
              <span className="font-medium">₺299 / Ay</span>
            </div>
          </div>
        </div>

        {/* Upgrade Card */}
        <div className="p-6 rounded-2xl border relative overflow-hidden" style={{ background: "var(--bg2)", borderColor: "var(--accent)" }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] opacity-20 pointer-events-none" style={{ background: "var(--accent)" }} />
          
          <h3 className="text-xl font-bold mb-2">PRO Plana Yükselt</h3>
          <p className="text-sm mb-6" style={{ color: "var(--text2)" }}>
            Aylık 299₺ karşılığında tüm özellikleri sınırsız kullanın.
          </p>

          <ul className="space-y-3 mb-8 text-sm">
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Sınırsız randevu yönetimi</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Merkezi WhatsApp bildirimleri</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Sınırsız personel ekleme</li>
            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> İptal riskini azaltan hatırlatıcılar</li>
          </ul>

          <a href="/api/payment/checkout" className="w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg block text-center" style={{ background: "var(--accent)", color: "#0a0a0a" }}>
            <CreditCard className="w-4 h-4" />
            Kredi Kartı ile Güvenli Ödeme Yap
          </a>
          <p className="text-[10px] text-center mt-3 opacity-60">iyzico güvencesiyle 256-bit SSL şifreleme</p>
        </div>
      </div>
    </div>
  );
}
