"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Send welcome email
      try {
        await fetch('/api/emails/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email, 
            name: email.split('@')[0], 
            type: 'welcome' 
          }),
        });
      } catch (err) {
        console.error("Failed to send welcome email:", err);
      }
      
      router.push("/onboarding");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md w-full p-8 rounded-2xl border relative overflow-hidden" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
        {/* Glow effect */}
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-50" style={{ background: "var(--accent)" }} />
        
        <div className="text-center mb-8 relative z-10">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>✂</div>
          <h1 className="font-heading font-bold text-3xl mb-2 tracking-tight">BerberBot</h1>
          <p className="text-sm font-light" style={{ color: "var(--text3)" }}>
            Kayıt Ol ve Dükkanını Dijitale Taşı
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text2)" }}>
              E-posta Adresi
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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
            {loading ? "Hesap Oluşturuluyor..." : "Kayıt Ol"}
          </button>
          
          <div className="text-center text-sm mt-6" style={{ color: "var(--text3)" }}>
            Zaten hesabınız var mı? <Link href="/login" className="font-medium hover:underline transition-colors" style={{ color: "var(--accent)" }}>Giriş Yap</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
