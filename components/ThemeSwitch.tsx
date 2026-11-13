"use client";
// Açık/koyu anahtarı (landing ve herkese açık sayfalar). Paneldeki ThemeToggle ile
// aynı "theme" kaydını kullanır; burada "Sistem" yok, seçim doğrudan kaydedilir.
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeSwitch() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Gizli sekme vb.: yalnızca bu oturumda uygulanır
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Koyu tema"
      title={dark ? "Açık temaya geç" : "Koyu temaya geç"}
      onClick={toggle}
      className="relative inline-flex h-8 w-[60px] flex-shrink-0 items-center rounded-full border transition-colors"
      style={{ background: "var(--bg3)", borderColor: "var(--border2)" }}
    >
      <Sun size={14} className="absolute left-2" style={{ color: "var(--text3)" }} aria-hidden />
      <Moon size={14} className="absolute right-2" style={{ color: "var(--text3)" }} aria-hidden />
      <span
        className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-sm transition-transform duration-200"
        style={{
          background: "var(--accent)",
          color: "var(--on-accent)",
          transform: `translateX(${mounted && dark ? 30 : 3}px)`,
        }}
      >
        {dark ? <Moon size={13} aria-hidden /> : <Sun size={13} aria-hidden />}
      </span>
    </button>
  );
}
