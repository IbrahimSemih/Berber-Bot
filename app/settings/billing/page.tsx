import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Check, AlertTriangle, CreditCard, Clock, Zap } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getShopUsageAndLimits, TRIAL_DAYS, YEARLY_REFUND_DAYS } from "@/lib/plan-limits";
import { isBillingProfileComplete, type BillingProfile } from "@/lib/checkout";
import AdminLayout from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/ui";
import RefundRequestButton from "./RefundRequestButton";
import BillingProfileForm from "./BillingProfileForm";
import PurchaseOptions from "./PurchaseOptions";
import { isStoreProvider, isWebBillingEnabled, providerLabel, STORE_LINKS } from "@/lib/billing-config";

const ERROR_MESSAGES: Record<string, string> = {
  payment_failed: "Ödeme tamamlanamadı: kart reddedildi veya bakiye yetersiz.",
  missing_token: "Ödeme oturumu bulunamadı. Lütfen tekrar deneyin.",
  system_error: "Ödeme sırasında beklenmeyen bir hata oluştu. Kartınızdan çekim yapıldıysa destek ekibimizle iletişime geçin.",
  amount_mismatch: "Ödeme tutarı doğrulanamadı. Lütfen destek ekibimizle iletişime geçin.",
  consent_required: "Ödemeye geçmek için Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi'ni onaylamanız gerekir.",
  billing_profile_required: "Ödemeye geçmeden önce fatura bilgilerinizi eksiksiz doldurun.",
  billing_profile_unavailable: "Fatura bilgileri şu an okunamıyor. Lütfen daha sonra tekrar deneyin.",
  too_many_requests: "Çok fazla deneme yaptınız. Lütfen birkaç dakika sonra tekrar deneyin.",
  billing_disabled: "Abonelikler artık BerberBot mobil uygulaması üzerinden satın alınıyor.",
};

/** Web'de satış kapalıyken ödeme kartının yerine: mobil uygulamadan abone olma bilgisi */
function MobileSubscribeInfo() {
  const hasLinks = !!(STORE_LINKS.appStore || STORE_LINKS.playStore);
  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: "var(--text2)" }}>
        Abonelikler BerberBot mobil uygulamasından App Store veya Google Play ile satın alınır. Uygulamaya bu hesabın
        e-posta ve şifresiyle giriş yapın; aboneliğiniz web panelinde de geçerli olur.
      </p>
      {hasLinks ? (
        <div className="flex flex-wrap gap-3">
          {STORE_LINKS.appStore && (
            <a href={STORE_LINKS.appStore} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: "var(--accent)", color: "#0a0a0a" }}>
              App Store&apos;dan indir
            </a>
          )}
          {STORE_LINKS.playStore && (
            <a href={STORE_LINKS.playStore} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: "var(--accent)", color: "#0a0a0a" }}>
              Google Play&apos;den indir
            </a>
          )}
        </div>
      ) : (
        <p className="text-sm font-medium" style={{ color: "var(--accent)" }}>
          Mobil uygulama çok yakında yayında. Bu arada sorularınız için destek ekibimize yazabilirsiniz.
        </p>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

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

  const webBilling = isWebBillingEnabled();
  const isStoreBilling = isStoreProvider(shop.billing_provider);
  const isTrialing = shop.subscription_status === 'trialing';
  const isActive = shop.subscription_status === 'active';
  
  const trialEnd = shop.trial_end ? new Date(shop.trial_end) : null;
  const currentPeriodEnd = shop.current_period_end ? new Date(shop.current_period_end) : null;
  const now = new Date();

  // Format dates safely
  const formatDate = (date: Date | null) => {
    if (!date) return "Belirsiz";
    return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  };

  const adminClient = createAdminClient();
  const [shopLimits, { data: billingProfileRow }] = await Promise.all([
    getShopUsageAndLimits(adminClient, shop.id),
    adminClient.from("billing_profiles").select("*").eq("shop_id", shop.id).maybeSingle(),
  ]);
  const billingProfile = (billingProfileRow ?? null) as Partial<BillingProfile> | null;
  const profileComplete = isBillingProfileComplete(billingProfile);
  const { plan, usage, limits, isLocked } = shopLimits;
  
  const isTrialExpired = isTrialing && trialEnd && trialEnd < now;

  // Süresi dolmuş, iptal edilmiş/iade edilmiş, deneme sürümündeki veya Başlangıç planındaki dükkanlar ödeme seçeneğini görür
  // Aktif abonelikte de bitişe 7 gün kala uzatma seçeneği gösterilir (otomatik yenileme yok)
  // Mağaza aboneliği kendiliğinden yenilenir; uzatma kartı yalnızca iyzico (tek seferlik ödeme) için
  const renewSoon = !isStoreBilling && isActive && !!currentPeriodEnd && currentPeriodEnd.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000;
  const showPurchaseCard = isLocked || !isActive || plan.id === "starter" || renewSoon;

  const { data: paymentRows } = await supabase
    .from("payments")
    .select("*")
    .eq("shop_id", shop.id)
    .in("status", ["success", "refunded"])
    .order("created_at", { ascending: false })
    .limit(20);
  const payments = paymentRows ?? [];
  
  const calculatePercentage = (current: number, max: number) => {
    if (max === Infinity) return 0;
    return Math.min(100, Math.round((current / max) * 100));
  };

  return (
    <AdminLayout>
      <PageHeader title="Abonelik ve Fatura" />
      <div className="p-7 max-w-4xl mx-auto space-y-8">
        <div>
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
          <p className="font-medium">{ERROR_MESSAGES[searchParams.error] ?? `Ödeme işlemi başlatılamadı: ${searchParams.error}`}</p>
        </div>
      )}

      {isLocked && (
        <div className="p-5 rounded-xl border bg-red-500/10 border-red-500/20 text-red-500">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="font-bold text-lg">Erişiminiz Kısıtlandı</h3>
          </div>
          <p className="text-sm">
            {isTrialExpired ? `${TRIAL_DAYS} günlük ücretsiz deneme süreniz dolmuştur.` : "Abonelik süreniz dolmuştur."} Sisteme tekrar erişebilmek ve randevularınızı yönetmeye devam edebilmek için lütfen PRO plana geçiş yapın.
          </p>
          <a href="#plans" className="inline-block mt-4 px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: "var(--accent)", color: "#0a0a0a" }}>{webBilling ? "Plan Seç ve Öde" : "Nasıl abone olurum?"}</a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Plan Card */}
        <div className="p-6 rounded-2xl border" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text3)" }}>Mevcut Planınız</p>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {plan.name}
                {isActive && <span className="px-2 py-1 text-[10px] uppercase rounded-full bg-green-500/20 text-green-500 tracking-wider">Aktif</span>}
                {isTrialing && !isTrialExpired && <span className="px-2 py-1 text-[10px] uppercase rounded-full bg-blue-500/20 text-blue-500 tracking-wider">Deneme Sürümü</span>}
              </h2>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--bg3)" }}>
              {isActive ? <Check className="w-6 h-6 text-green-500" /> : <Clock className="w-6 h-6 text-blue-500" />}
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between pb-4 border-b" style={{ borderColor: "var(--border)" }}>
              <span style={{ color: "var(--text2)" }}>Durum</span>
              <span className="font-medium">
                {isLocked ? <span className="text-red-500">Süresi Doldu</span> : "Kullanıma Açık"}
              </span>
            </div>
            <div className="flex justify-between pb-4 border-b" style={{ borderColor: "var(--border)" }}>
              <span style={{ color: "var(--text2)" }}>{isActive ? "Abonelik Bitiş Tarihi" : "Deneme Bitiş Tarihi"}</span>
              <span className="font-medium">
                {isActive ? formatDate(currentPeriodEnd) : formatDate(trialEnd)}
              </span>
            </div>
            <div className="flex justify-between pb-4 border-b" style={{ borderColor: "var(--border)" }}>
              <span style={{ color: "var(--text2)" }}>Aylık Tutar</span>
              <span className="font-medium">₺{plan.price} / Ay</span>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-bold text-sm" style={{ color: "var(--text2)" }}>Kullanım Durumu (Bu Ay)</h3>
            
            {/* Appointments Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Randevu Sayısı</span>
                <span className="font-medium">
                  {usage.appointments} / {limits.appointments === Infinity ? "Sınırsız" : limits.appointments}
                </span>
              </div>
              <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "var(--bg3)" }}>
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${!shopLimits.canAddAppointment ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${calculatePercentage(usage.appointments, limits.appointments)}%` }} 
                />
              </div>
            </div>

            {/* Staff Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Personel Kapasitesi</span>
                <span className="font-medium">
                  {usage.staff} / {limits.staff === Infinity ? "Sınırsız" : limits.staff}
                </span>
              </div>
              <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "var(--bg3)" }}>
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${!shopLimits.canAddStaff ? 'bg-red-500' : 'bg-purple-500'}`}
                  style={{ width: `${calculatePercentage(usage.staff, limits.staff)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Card */}
        {showPurchaseCard ? (
          <div id="plans" className="p-6 rounded-2xl border relative overflow-hidden flex flex-col" style={{ background: "var(--bg2)", borderColor: "var(--accent)" }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] opacity-20 pointer-events-none" style={{ background: "var(--accent)" }} />
            
            <h3 className="text-xl font-bold mb-2">{isLocked || renewSoon ? "Aboneliğinizi Yenileyin" : "PRO Plana Geç"}</h3>
            <p className="text-sm mb-6" style={{ color: "var(--text2)" }}>
              {!webBilling
                ? isLocked
                  ? "Mobil uygulamadan abone olarak panelinize ve randevu sayfanıza yeniden erişin."
                  : "Deneme süreniz boyunca tüm özellikler açık. Süre bitmeden mobil uygulamadan abone olabilirsiniz."
                : isLocked ? "Ödemenizi yaparak panelinize ve randevu sayfanıza anında yeniden erişin." : renewSoon ? "Aboneliğiniz yakında bitiyor. Şimdi uzatırsanız yeni dönem mevcut bitiş tarihinin üzerine eklenir." : "Şimdi geçerseniz kalan deneme günleriniz kaybolmaz; ücretli dönem deneme bitişinden itibaren başlar."}
            </p>

            <ul className="space-y-3 mb-8 text-sm flex-1">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Sınırsız randevu yönetimi</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Merkezi WhatsApp bildirimleri</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Sınırsız personel ekleme</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> İptal riskini azaltan hatırlatıcılar</li>
            </ul>

            {webBilling ? <PurchaseOptions profileComplete={profileComplete} /> : <MobileSubscribeInfo />}
          </div>
        ) : (
          <div className="p-6 rounded-2xl border flex flex-col items-center justify-center text-center" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(34, 197, 94, 0.1)", color: "#22c55e" }}>
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Harika Gidiyorsunuz!</h3>
            <p className="text-sm max-w-xs" style={{ color: "var(--text2)" }}>
              {isStoreBilling
                ? `Aboneliğiniz ${providerLabel(shop.billing_provider)} üzerinden yönetiliyor ve ${formatDate(currentPeriodEnd)} tarihinde ${shop.store_will_renew === false ? "sona erecek" : "otomatik olarak yenilenecek"}. İptal veya değişiklik için ${providerLabel(shop.billing_provider)} abonelik ayarlarını kullanın.`
                : `Aboneliğiniz ${formatDate(currentPeriodEnd)} tarihine kadar aktif. Otomatik yenileme olmadığından süre bitmeden önce size e-posta ile hatırlatma yapılır.`}
            </p>
          </div>
        )}
      </div>

      {/* Fatura bilgileri (yalnızca web/iyzico satışı açıkken) */}
      {webBilling && (
      <div id="fatura" className="p-6 rounded-2xl border scroll-mt-24" style={{ background: "var(--bg2)", borderColor: profileComplete ? "var(--border)" : "var(--orange)" }}>
        <h3 className="font-bold text-lg mb-1">Fatura Bilgileri</h3>
        <p className="text-xs mb-5" style={{ color: "var(--text3)" }}>
          Ödemelerinize ait fatura bu bilgilerle düzenlenir ve kayıtlı e-posta adresinize gönderilir.
        </p>
        <BillingProfileForm initial={billingProfile} complete={profileComplete} />
      </div>
      )}

      {/* Ödeme geçmişi & iade */}
      <div className="p-6 rounded-2xl border" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
        <h3 className="font-bold text-lg mb-1">Ödeme Geçmişi</h3>
        <p className="text-xs mb-5" style={{ color: "var(--text3)" }}>
          Kartla yapılan yıllık plan ödemelerinde ilk {YEARLY_REFUND_DAYS} gün koşulsuz iade talep edebilirsiniz. App Store / Google Play ödemelerinin iadesi mağaza üzerinden talep edilir.
        </p>
        {payments.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text3)" }}>Henüz ödeme yapılmamış.</p>
        ) : (
          <div className="flex flex-col">
            {payments.map((p) => {
              const ageDays = (now.getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24);
              const daysLeft = Math.ceil(YEARLY_REFUND_DAYS - ageDays);
              const isIyzico = (p.provider ?? "iyzico") === "iyzico";
              const canRefund = isIyzico && p.status === "success" && p.billing_interval === "yearly" && !p.refund_requested_at && !p.refunded_at && daysLeft > 0;
              const statusLabel = p.status === "refunded" ? "İade edildi" : p.refund_requested_at ? "İade talebi inceleniyor" : "Ödendi";
              const statusColor = p.status === "refunded" ? "var(--blue)" : p.refund_requested_at ? "var(--orange)" : "var(--green)";
              return (
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <div className="font-medium text-sm">
                      Profesyonel · {p.billing_interval === "yearly" ? "Yıllık" : "Aylık"} · ₺{Number(p.amount).toLocaleString("tr-TR")}
                      {!isIyzico && ` · ${providerLabel(p.provider)}${p.environment === "sandbox" ? " (test)" : ""}`}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>{formatDate(new Date(p.created_at))}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: statusColor, background: "var(--bg3)" }}>{statusLabel}</span>
                    {canRefund && <RefundRequestButton paymentId={p.id} daysLeft={daysLeft} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </AdminLayout>
  );
}
