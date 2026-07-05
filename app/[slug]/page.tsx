import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import BookingForm from "./BookingForm";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function PublicShopPage({ params }: { params: { slug: string } }) {
  const supabase = createAdminClient();

  // Reserved slugs that should not trigger the public booking page
  const reservedSlugs = ["login", "dashboard", "banned", "superadmin", "onboarding", "customers", "appointments", "settings", "whatsapp"];
  if (reservedSlugs.includes(params.slug)) {
    return notFound();
  }

  // Fetch shop
  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, status")
    .eq("slug", params.slug)
    .single();

  if (!shop || shop.status === "banned") {
    return notFound();
  }

  // Fetch settings
  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .eq("shop_id", shop.id)
    .single();

  // Fetch active services
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("shop_id", shop.id)
    .eq("is_active", true)
    .order("name");

  // Fetch active staff
  const { data: staffList } = await supabase
    .from("staff")
    .select("id, name")
    .eq("shop_id", shop.id)
    .eq("is_active", true)
    .order("name");

  if (!services || services.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Hizmet Bulunamadı</h1>
          <p className="text-gray-500">Bu dükkan şu anda web üzerinden randevu kabul etmiyor (Aktif hizmet bulunamadı).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 rounded-full blur-[120px] pointer-events-none opacity-20" style={{ background: "var(--accent)" }} />
      
      <div className="max-w-2xl mx-auto px-4 py-12 relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 font-bold shadow-xl" style={{ background: "var(--bg3)", color: "var(--accent)" }}>
            {shop.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-3xl font-heading font-black mb-2">{shop.name}</h1>
          <p className="text-sm font-medium" style={{ color: "var(--text2)" }}>Online Randevu Sistemi</p>
        </div>

        <BookingForm shop={shop} services={services} settings={settings} staffList={staffList || []} />
      </div>
    </div>
  );
}
