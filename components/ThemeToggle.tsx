"use client";
// Tema seçici: Sistem / Açık / Koyu. Seçim localStorage'da ("theme") tutulur;
// <html data-theme> ilk boyamadan önce app/layout.tsx'teki THEME_SCRIPT ile
// ayarlanır (titreme olmaz). "Sistem"de işletim sistemi teması değişince izlenir.
import { useEffect, useState } from "react";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";

export type ThemePref = "system" | "light" | "dark";
const STORAGE_KEY = "theme";

/** Panel yolları: kayıtlı tercih yoksa burada sistem teması izlenir. */
const PANEL_PATHS = ["/dashboard", "/analytics", "/appointments", "/customers", "/staff", "/notifications", "/settings", "/profile", "/onboarding"];

/**
 * İlk boyamadan önce çalışan betik (layout <head> içinde). Kayıtlı tercih yoksa:
 * panelde sistem teması, landing ve diğer herkese açık sayfalarda açık tema.
 */
export const THEME_SCRIPT = `(function(){try{var p=localStorage.getItem("${STORAGE_KEY}");if(!p){var path=location.pathname;p=${JSON.stringify(PANEL_PATHS)}.some(function(x){return path===x||path.indexOf(x+"/")===0})?"system":"light"}var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}})()`;

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function apply(pref: ThemePref) {
  const dark =
    pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

const OPTIONS: { value: ThemePref; label: string; icon: LucideIcon }[] = [
  { value: "system", label: "Sistem", icon: Monitor },
  { value: "light", label: "Açık", icon: Sun },
  { value: "dark", label: "Koyu", icon: Moon },
];

/** Kenar menüsünün altındaki üçlü seçici (koyu zemin üstünde). */
export default function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref>("system");

  useEffect(() => {
    setPref(readPref());
  }, []);

  // "Sistem" seçiliyken işletim sistemi teması değişirse uygula
  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  const choose = (value: ThemePref) => {
    setPref(value);
    try {
      if (value === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Gizli sekme vb.: yalnızca bu oturumda uygulanır
    }
    apply(value);
  };

  return (
    <div role="radiogroup" aria-label="Görünüm" className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--on-hero-dim)" }}>
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = pref === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            title={label}
            onClick={() => choose(value)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-colors"
            style={active ? { background: "var(--bg2)", color: "var(--accent)" } : { color: "var(--on-hero2)" }}
          >
            <Icon size={14} aria-hidden />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
