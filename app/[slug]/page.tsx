import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { MapPin, Phone, Instagram, Clock } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getShopUsageAndLimits } from "@/lib/plan-limits";
import { RESERVED_SLUGS } from "@/lib/slug";
import { getBookableDates, resolveWorkingHours } from "@/lib/booking";
import { normalizeTrPhone } from "@/lib/validations";
import { instagramHandle } from "@/lib/utils";
import { SITE } from "@/lib/site-config";
import BookingForm from "./BookingForm";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const DAY_LABELS: Record<number, string> = {
  1: "Pazartesi", 2: "Salı", 3: "Çarşamba", 4: "Perşembe", 5: "Cuma", 6: "Cumartesi", 0: "Pazar",
};

const getShopBySlug = cache(async (slug: string) => {
  if (RESERVED_SLUGS.has(slug)) return null;
  const supabase = createAdminClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, slug, status")
    .eq("slug", slug)
    .maybeSingle();
  if (!shop || shop.status === "banned") return null;
  return shop;
});

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const shop = await getShopBySlug(params.slug);
  if (!shop) return { title: "Sayfa bulunamadı · BerberBot" };
  const title = `${shop.name} · Online Randevu`;
  const description = `${shop.name} için online randevu alın. Uygun saati seçin, onay ve hatırlatma WhatsApp ile gelsin.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE.url}/${shop.slug}` },
    openGraph: { title, description, url: `${SITE.url}/${shop.slug}`, siteName: SITE.name, locale: "tr_TR", type: "website" },
  };
}

export default async function PublicShopPage({ params }: { params: { slug: string } }) {
  const shop = await getShopBySlug(params.slug);
  if (!shop) return notFound();

  const supabase = createAdminClient();

  const [{ data: settings }, { data: services }, { data: staffList }, shopLimits] = await Promise.all([
    supabase.from("settings").select("*").eq("shop_id", shop.id).maybeSingle(),
    supabase
      .from("services")
      .select("id, name, duration_minutes, price")
      .eq("shop_id", shop.id)
      .eq("is_active", true)
      .order("name"),
    supabase.from("staff").select("id, name").eq("shop_id", shop.id).eq("is_active", true).order("name"),
    getShopUsageAndLimits(supabase, shop.id),
  ]);

  const workingHours = resolveWorkingHours(settings);
  const phone = settings?.whatsapp_number ? normalizeTrPhone(settings.whatsapp_number) : null;
  const address: string | null = typeof settings?.address === "string" && settings.address.trim() ? settings.address.trim() : null;
  const instagram = instagramHandle(settings?.instagram);

  const contactCard = (
    <div className="mt-8 p-6 rounded-2xl border flex flex-col gap-4 text-sm" style={{ background: "var(--bg2)", borderColor: "var(--border)", color: "var(--text2)" }}>
      {address && (
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.name} ${address}`)}`} target="_blank" rel="noreferrer"
          className="flex items-start gap-3 hover:text-[var(--text)] transition-colors">
          <MapPin size={18} className="flex-shrink-0 mt-0.5" style={{ color: "var(--accent)" }} aria-hidden />
          <span>{address}</span>
        </a>
      )}
      {phone && (
        <a href={`tel:${phone}`} className="flex items-center gap-3 hover:text-[var(--text)] transition-colors">
          <Phone size={18} className="flex-shrink-0" style={{ color: "var(--accent)" }} aria-hidden />
          <span>{phone.replace(/^\+90(\d{3})(\d{3})(\d{2})(\d{2})$/, "0$1 $2 $3 $4")}</span>
        </a>
      )}
      {instagram && (
        <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-[var(--text)] transition-colors">
          <Instagram size={18} className="flex-shrink-0" style={{ color: "var(--accent)" }} aria-hidden />
          <span>@{instagram}</span>
        </a>
      )}
      <div className="flex items-start gap-3">
        <Clock size={18} className="flex-shrink-0 mt-0.5" style={{ color: "var(--accent)" }} aria-hidden />
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 flex-1">
          {[1, 2, 3, 4, 5, 6, 0].map((day) => {
            const wh = workingHours.find((w) => w.day === day);
            return (
              <div key={day} className="contents">
                <span>{DAY_LABELS[day]}</span>
                <span className="text-right" style={{ color: wh?.is_open ? "var(--text)" : "var(--text3)" }}>
                  {wh?.is_open ? `${wh.start} – ${wh.end}` : "Kapalı"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 rounded-full blur-[120px] pointer-events-none opacity-20" style={{ background: "var(--accent)" }} />

      <div className="max-w-2xl mx-auto px-4 py-12 relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 font-bold shadow-xl" style={{ background: "var(--bg3)", color: "var(--accent)" }}>
            {shop.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-3xl font-heading font-black mb-2">{shop.name}</h1>
          <p className="text-sm font-medium" style={{ color: "var(--text2)" }}>Online Randevu</p>
        </div>

        {shopLimits.isLocked ? (
          <div className="text-center p-8 rounded-2xl border" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
            <h2 className="text-xl font-bold mb-3">Online Randevu Şu An Kapalı</h2>
            <p style={{ color: "var(--text2)" }}>
              Bu işletme şu anda online randevu kabul etmiyor. Randevu için lütfen işletmeyle doğrudan iletişime geçin.
            </p>
          </div>
        ) : !services || services.length === 0 ? (
          <div className="text-center p-8 rounded-2xl border" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
            <h2 className="text-xl font-bold mb-3">Hizmet Bulunamadı</h2>
            <p style={{ color: "var(--text2)" }}>Bu işletme henüz online randevuya açık bir hizmet tanımlamamış.</p>
          </div>
        ) : (
          <BookingForm shop={{ id: shop.id, name: shop.name }} services={services} staffList={staffList || []} bookableDates={getBookableDates()} />
        )}

        {contactCard}

        <p className="text-center text-xs mt-8" style={{ color: "var(--text3)" }}>
          <a href={SITE.url} className="hover:text-[var(--text)] transition-colors">BerberBot</a> ile online randevu
        </p>
      </div>
    </div>
  );
}
