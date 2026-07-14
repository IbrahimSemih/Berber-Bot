"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { loginSchema } from "@/lib/validations";
import { motion } from "framer-motion";

export default function LoginPage() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side Zod validation
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  const handleNavToSignup = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExiting(true);
    setTimeout(() => {
      router.push("/signup");
    }, 400); // 400ms animasyon süresi
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)", color: "var(--text)", perspective: "1000px" }}>
      <motion.div 
        initial={{ rotateY: -90, opacity: 0, scale: 0.9 }}
        animate={isExiting ? { rotateY: 90, opacity: 0, scale: 0.9 } : { rotateY: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="max-w-md w-full p-8 rounded-2xl border relative overflow-hidden" 
        style={{ background: "var(--bg2)", borderColor: "var(--border)", transformStyle: "preserve-3d" }}
      >
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-50" style={{ background: "var(--accent)" }} />

        <div className="text-center mb-8 relative z-10">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>✂</div>
          <h1 className="font-heading font-bold text-3xl mb-2 tracking-tight">BerberBot</h1>
          <p className="text-sm font-light" style={{ color: "var(--text3)" }}>
            İşletme Yönetim Paneli
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm border focus:outline-none transition-colors pr-12"
                style={{ background: "rgba(0,0,0,0.2)", borderColor: "var(--border)", color: "var(--text)" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: "var(--text2)" }}
                aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="text-right mt-1.5">
              <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: "var(--accent)" }}>
                Şifremi Unuttum
              </Link>
            </div>
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
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>

          <div className="text-center text-sm mt-6" style={{ color: "var(--text3)" }}>
            Hesabınız yok mu?{" "}
            <a href="/signup" onClick={handleNavToSignup} className="font-medium hover:underline transition-colors cursor-pointer" style={{ color: "var(--accent)" }}>
              Kayıt Ol
            </a>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
