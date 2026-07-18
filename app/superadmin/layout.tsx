"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/superadmin", label: "Genel Bakış", icon: "📊" },
  { href: "/superadmin/shops", label: "Dükkanlar", icon: "🏪" },
  { href: "/superadmin/analytics", label: "Platform Analitiği", icon: "📈" },
];

import { logoutSuperAdmin } from "./login/actions";


export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await logoutSuperAdmin();
  };

  const isLoginPage = pathname === "/superadmin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* ── SIDEBAR ── */}
      <aside className="w-64 min-h-screen fixed left-0 top-0 flex flex-col z-50 border-r" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
        {/* Glow effect */}
        <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full blur-[100px] pointer-events-none opacity-20" style={{ background: "var(--accent)" }} />

        {/* Logo */}
        <div className="px-6 py-8 border-b relative z-10" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl" style={{ background: "var(--accent)", color: "#0a0a0a" }}>
              SA
            </div>
            <div>
              <div className="font-heading font-black text-lg tracking-tight">Super Admin</div>
              <div className="text-xs font-medium" style={{ color: "var(--text3)" }}>Yönetim Paneli</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 flex flex-col gap-1 mt-2 relative z-10">
          <div className="text-[10px] font-bold px-3 py-4 uppercase tracking-[0.2em]" style={{ color: "var(--text3)" }}>Menü</div>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all font-medium",
                  active ? "bg-opacity-10" : "hover:bg-opacity-5"
                )}
                style={{ 
                  background: active ? "var(--accent-dim)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text2)",
                }}>
                <span className="text-lg opacity-80">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t relative z-10" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: "var(--bg3)", borderColor: "var(--border)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black font-heading" style={{ background: "var(--bg4)", color: "var(--text)" }}>SA</div>
            <div className="flex-1">
              <div className="text-sm font-semibold truncate max-w-[120px]">Sistem Sahibi</div>
            </div>
            <button onClick={handleLogout} className="text-xs font-medium px-2 py-1 rounded-md transition-colors" style={{ color: "var(--red)", background: "rgba(255, 95, 87, 0.1)" }}>Çıkış</button>
          </div>
        </div>
      </aside>

      {/* ── CONTENT ── */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen relative">
        {/* Subtle background glow for main content */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-10" style={{ background: "var(--accent)" }} />
        {children}
      </main>
    </div>
  );
}
