"use client";

import { useState } from "react";
import { loginSuperAdmin } from "./actions";

export default function SuperAdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await loginSuperAdmin(formData);
    
    // If we reach here, there was an error (since successful redirect throws inside server action)
    if (result && result.error) {
      setErrorMsg(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md w-full p-8 rounded-2xl border relative overflow-hidden" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
        {/* Glow effect - red for super admin */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-50 bg-red-600" />
        
        <div className="text-center mb-8 relative z-10">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4 bg-red-600 text-white font-bold font-heading">
            S
          </div>
          <h1 className="font-heading font-bold text-3xl mb-2 tracking-tight">Super Admin</h1>
          <p className="text-sm font-light" style={{ color: "var(--text3)" }}>
            Sistem Sahibi Girişi
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text2)" }}>
              E-posta Adresi
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="isim@sirket.com"
              className="w-full px-4 py-3 rounded-xl text-sm border focus:outline-none transition-colors"
              style={{ background: "rgba(0,0,0,0.2)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text2)" }}>
              Şifre
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl text-sm border focus:outline-none transition-colors"
              style={{ background: "rgba(0,0,0,0.2)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>

          {errorMsg && (
            <div className="text-sm p-3 rounded-lg border bg-red-50 border-red-200 text-red-600">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 hover:-translate-y-0.5 mt-2 bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
