"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md w-full p-8 rounded-2xl border relative overflow-hidden" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-50" style={{ background: "var(--accent)" }} />
        
        <div className="text-center mb-8 relative z-10">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>🔒</div>
          <h1 className="font-heading font-bold text-2xl mb-2 tracking-tight">Yeni Şifre</h1>
          <p className="text-sm font-light" style={{ color: "var(--text3)" }}>
            Hesabınız için yeni bir şifre belirleyin.
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4 relative z-10">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
              style={{ background: "var(--accent)", color: "#0a0a0a" }}>✓</div>
            <h2 className="text-xl font-bold">Şifreniz Güncellendi</h2>
            <p className="text-sm" style={{ color: "var(--text2)" }}>
              Panele yönlendiriliyorsunuz...
            </p>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-5 relative z-10">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text2)" }}>
                Yeni Şifre
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full px-4 py-3 rounded-xl text-sm border focus:outline-none transition-colors"
                style={{ background: "rgba(0,0,0,0.2)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </div>

            {error && (
              <div className="text-sm p-3 rounded-lg border" style={{ background: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.2)", color: "#f87171" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 hover:-translate-y-0.5 mt-2"
              style={{ background: "var(--accent)", color: "#0a0a0a" }}
            >
              {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
