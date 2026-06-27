"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard",    label: "Dashboard",     icon: "⊞" },
  { href: "/appointments", label: "Randevular",     icon: "📅" },
  { href: "/customers",    label: "Müşteriler",     icon: "👥" },
  { href: "/whatsapp",     label: "WhatsApp Bot",   icon: "💬" },
  { href: "/settings",     label: "Ayarlar",        icon: "⚙" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [shopName, setShopName] = useState("Yükleniyor...");
  const [shopInitials, setShopInitials] = useState("...");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadShop() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: shop, error } = await supabase.from("shops").select("name").eq("owner_id", user.id).single();
      
      if (shop) {
        setShopName(shop.name);
        const parts = shop.name.split(" ");
        const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : shop.name.substring(0, 2);
        setShopInitials(initials.toUpperCase());
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
        style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg" style={{ color: "var(--text)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: "var(--accent)", color: "#0a0a0a" }}>✂</div>
          <span className="font-heading font-black text-base tracking-tight">BerberBot</span>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={cn(
        "w-60 min-h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300",
        "md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
        style={{ background: "var(--bg2)", borderRight: "1px solid var(--border)" }}>
        {/* Logo */}
        <div className="px-5 py-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg"
              style={{ background: "var(--accent)", color: "#0a0a0a" }}>✂</div>
            <div>
              <div className="font-heading font-black text-base tracking-tight">BerberBot</div>
              <div className="text-xs" style={{ color: "var(--text3)" }}>Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-0.5">
          <div className="text-xs font-semibold px-2 py-3 uppercase tracking-widest" style={{ color: "var(--text3)" }}>Ana Menü</div>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors font-medium",
                  active ? "font-semibold" : ""
                )}
                style={active
                  ? { background: "var(--accent-dim)", color: "var(--accent)" }
                  : { color: "var(--text2)" }
                }>
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
          <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 8 }}>
            <Link href="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{ color: "var(--text3)" }}>
              <span className="text-base">🏠</span> Landing Page
            </Link>
          </div>
        </nav>

        {/* User */}
        <div className="p-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black font-heading"
              style={{ background: "linear-gradient(135deg, var(--accent) 0%, #80c020 100%)", color: "#0a0a0a" }}>{shopInitials}</div>
            <div className="flex-1">
              <div className="text-sm font-medium truncate max-w-[120px]">{shopName}</div>
              <div className="text-xs" style={{ color: "var(--text3)" }}>Dükkan Sahibi</div>
            </div>
            <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-600 px-2 py-1 bg-red-50 rounded">Çıkış</button>
          </div>
        </div>
      </aside>

      {/* ── CONTENT ── */}
      <main className="md:ml-60 flex-1 flex flex-col min-h-screen pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
