"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Burada Sentry veya başka bir monitoring aracına hata gönderilebilir
    console.error("Uygulama Hatası:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-500/10 text-red-500">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      
      <h1 className="text-3xl font-heading font-bold mb-4">Bir şeyler ters gitti!</h1>
      <p className="mb-8 max-w-md text-sm leading-relaxed" style={{ color: "var(--text2)" }}>
        İşleminiz sırasında beklenmedik bir hata oluştu. Lütfen sayfayı yenileyin veya ana sayfaya dönerek tekrar deneyin.
      </p>
      
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-80"
          style={{ background: "var(--accent)", color: "#0a0a0a" }}
        >
          Tekrar Dene
        </button>
        <Link 
          href="/"
          className="px-6 py-3 rounded-xl font-bold text-sm border transition-all hover:bg-white/5"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          Ana Sayfa
        </Link>
      </div>
    </div>
  );
}
