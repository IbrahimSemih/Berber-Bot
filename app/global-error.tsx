"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Fatal Error:", error);
  }, [error]);

  return (
    <html lang="tr">
      <body style={{ background: "#FAF7F2", color: "#1F2421", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", textAlign: "center", padding: "20px" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Kritik Bir Hata Oluştu!</h1>
          <p style={{ color: "#565B55", marginBottom: "2rem" }}>
            Sistemde beklenmeyen bir hata meydana geldi. Uygulamayı yeniden başlatmayı deneyin.
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => reset()}
              style={{ padding: "12px 24px", background: "#2F6B4F", color: "#FFFFFF", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
            >
              Tekrar Dene
            </button>
            <Link 
              href="/"
              style={{ padding: "12px 24px", background: "transparent", color: "#1F2421", border: "1px solid #D6CCBD", borderRadius: "8px", fontWeight: "bold", textDecoration: "none" }}
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
