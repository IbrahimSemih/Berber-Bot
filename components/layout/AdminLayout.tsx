"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import NotificationListener from "@/app/(panel)/dashboard/components/NotificationListener";
import { SUPPORT, supportWhatsappLink } from "@/lib/site-config";
import { ShopContext, type PanelShop } from "@/components/layout/ShopContext";
import ThemeToggle from "@/components/ThemeToggle";

const supportWhatsapp = supportWhatsappLink();
const supportIsWhatsapp = !!supportWhatsapp;
const supportHref = supportWhatsapp ?? `mailto:${SUPPORT.email}`;
import {
  LayoutDashboard, BarChart3, Calendar, Users, Scissors, Bell, Settings, CreditCard, Menu, LogOut,
  BookOpen, LifeBuoy, type LucideIcon,
} from "lucide-react";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard",        label: "Dashboard",         icon: LayoutDashboard },
  { href: "/analytics",        label: "Analitik",          icon: BarChart3 },
  { href: "/appointments",     label: "Randevular",        icon: Calendar },
  { href: "/customers",        label: "Müşteriler",        icon: Users },
  { href: "/staff",            label: "Personeller",       icon: Scissors },
  { href: "/notifications",    label: "Bildirimler",       icon: Bell },
  { href: "/settings",         label: "Ayarlar",           icon: Settings },
  { href: "/settings/billing", label: "Fatura & Abonelik", icon: CreditCard },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [shopName, setShopName] = useState("Yükleniyor...");
  const [shopInitials, setShopInitials] = useState("...");
  const [shop, setShop] = useState<PanelShop | null>(null);
  const currentShopId = shop?.id ?? null;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadShop() {
      const { data: { session } } = await supabase.auth.getSession(); // yerel, ağ isteği yok; yetkiyi RLS uygular
      const user = session?.user;
      if (!user) return;
      const { data: shop, error } = await supabase.from("shops").select("id, name, slug").eq("owner_id", user.id).single();
      
      if (shop) {
        setShop({ id: shop.id, name: shop.name, slug: shop.slug ?? null });
        setShopName(shop.name);
        const parts = shop.name.split(" ");
        const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : shop.name.substring(0, 2);
        setShopInitials(initials.toUpperCase());

        // Fetch initial unread count
        const { count } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shop.id)
          .eq("is_read", false);
        
        setUnreadCount(count || 0);

      } else {
        // No shop found, user needs to complete onboarding
        router.push("/onboarding");
      }
    }
    loadShop();
  }, [supabase, router]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 flex items-center px-4 gap-3 z-50"
        style={{ background: "var(--nav)", color: "var(--on-hero)" }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg" style={{ color: "var(--on-hero)" }} aria-label="Menüyü aç/kapat">
          <Menu size={24} aria-hidden />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--on-hero-dim)", color: "var(--on-hero)" }}><Scissors size={14} strokeWidth={2.5} aria-hidden /></div>
          <span className="font-heading font-black text-base tracking-tight">BerberBot</span>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-[var(--overlay)] z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={cn(
        "w-60 min-h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300",
        "md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
        style={{ background: "var(--nav)", color: "var(--on-hero)" }}>
        {/* Logo */}
        <div className="px-5 py-6" style={{ borderBottom: "1px solid var(--on-hero-dim)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--on-hero-dim)", color: "var(--on-hero)" }}><Scissors size={18} strokeWidth={2.5} aria-hidden /></div>
            <div>
              <div className="font-heading font-black text-base tracking-tight">BerberBot</div>
              <div className="text-xs" style={{ color: "var(--on-hero2)" }}>Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
          <div className="text-xs font-semibold px-2 py-3 uppercase tracking-widest" style={{ color: "var(--on-hero2)" }}>Ana Menü</div>
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 font-medium hover:bg-[var(--on-hero-dim)]",
                  active ? "font-semibold" : ""
                )}
                style={active
                  ? { background: "var(--bg2)", color: "var(--accent)" }
                  : { color: "var(--on-hero)" }
                }>
                <Icon size={17} strokeWidth={active ? 2.25 : 1.75} className="flex-shrink-0" aria-hidden />
                <div className="flex-1 flex items-center justify-between">
                  <span>{item.label}</span>
                  {item.href === "/notifications" && unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--red)", color: "var(--bg2)" }}>
                      {unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}

          <div className="text-xs font-semibold px-2 pt-5 pb-2 uppercase tracking-widest" style={{ color: "var(--on-hero2)" }}>Yardım</div>
          <Link href="/rehber" target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 font-medium hover:bg-[var(--on-hero-dim)]"
            style={{ color: "var(--on-hero)" }}>
            <BookOpen size={17} strokeWidth={1.75} className="flex-shrink-0" aria-hidden />
            <span>Kullanım Rehberi</span>
          </Link>
          <a href={supportHref} target={supportIsWhatsapp ? "_blank" : undefined} rel="noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 font-medium hover:bg-[var(--on-hero-dim)]"
            style={{ color: "var(--on-hero)" }}>
            <LifeBuoy size={17} strokeWidth={1.75} className="flex-shrink-0" aria-hidden />
            <span>{supportIsWhatsapp ? "WhatsApp Destek" : "Destek"}</span>
          </a>
        </nav>

        {/* User */}
        <div className="p-4 flex flex-col gap-3" style={{ borderTop: "1px solid var(--on-hero-dim)" }}>
          <ThemeToggle />
          <div className="flex items-center gap-3 p-2 rounded-lg transition-opacity">
            <Link href="/profile" className="flex items-center gap-3 flex-1 hover:opacity-80">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black font-heading"
                style={{ background: "var(--bg2)", color: "var(--accent)" }}>{shopInitials}</div>
              <div className="flex-1">
                <div className="text-sm font-medium truncate max-w-[120px]">{shopName}</div>
                <div className="text-xs" style={{ color: "var(--on-hero2)" }}>Profilim</div>
              </div>
            </Link>
            <button onClick={handleLogout} title="Çıkış yap" aria-label="Çıkış yap"
              className="p-2 rounded-lg z-10 relative transition-colors duration-150 hover:bg-[var(--on-hero-dim)]"
              style={{ color: "var(--on-hero2)" }}>
              <LogOut size={16} aria-hidden />
            </button>
          </div>
        </div>
      </aside>

      {/* ── CONTENT ── */}
      <main className="md:ml-60 flex-1 flex flex-col min-h-screen pt-14 md:pt-0">
        <ShopContext.Provider value={shop}>{children}</ShopContext.Provider>
      </main>

      {/* Realtime Notifications */}
      {currentShopId && (
        <NotificationListener 
          shopId={currentShopId} 
          onNewNotification={() => setUnreadCount(prev => prev + 1)} 
        />
      )}
    </div>
  );
}
