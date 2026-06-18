"use client";
import { cn } from "@/lib/utils";
import { AppointmentStatus, AppointmentSource } from "@/types";

// ─── Button ──────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md";
}
export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  const base = "inline-flex items-center gap-2 rounded-lg font-medium transition-colors cursor-pointer border-0 font-dm";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  const variants = {
    primary: "bg-[var(--accent)] text-[#0a0a0a] hover:bg-[var(--accent2)]",
    ghost: "bg-transparent text-[var(--text2)] border border-[var(--border2)] hover:bg-[var(--bg3)] hover:text-[var(--text)]",
    danger: "bg-[rgba(255,95,87,0.1)] text-[var(--red)] border border-[rgba(255,95,87,0.2)] hover:bg-[rgba(255,95,87,0.2)]",
  };
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeColor = "green" | "orange" | "red" | "blue" | "gray";
const badgeStyles: Record<BadgeColor, string> = {
  green:  "bg-[rgba(76,175,125,0.12)]  text-[#4caf7d]",
  orange: "bg-[rgba(255,170,51,0.12)]  text-[#ffaa33]",
  red:    "bg-[rgba(255,95,87,0.12)]   text-[#ff5f57]",
  blue:   "bg-[rgba(74,158,255,0.12)]  text-[#4a9eff]",
  gray:   "bg-[rgba(255,255,255,0.06)] text-[var(--text3)]",
};
export function Badge({ color, children }: { color: BadgeColor; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium", badgeStyles[color])}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const map: Record<AppointmentStatus, { color: BadgeColor; label: string }> = {
    pending:   { color: "orange", label: "Bekliyor" },
    confirmed: { color: "green",  label: "Onaylı" },
    cancelled: { color: "red",    label: "İptal" },
    completed: { color: "blue",   label: "Tamamlandı" },
  };
  const { color, label } = map[status];
  return <Badge color={color}>{label}</Badge>;
}

export function SourceBadge({ source }: { source: AppointmentSource }) {
  return source === "whatsapp"
    ? <Badge color="green">WhatsApp</Badge>
    : <Badge color="blue">Manuel</Badge>;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const avColors = [
  { bg: "#1a3a1a", color: "var(--accent)" },
  { bg: "#1a2a3a", color: "#4a9eff" },
  { bg: "#3a1a1a", color: "#ff5f57" },
  { bg: "#3a2a1a", color: "#ffaa33" },
  { bg: "#2a1a3a", color: "#c77dff" },
];
export function Avatar({ name, index = 0 }: { name: string; index?: number }) {
  const style = avColors[index % avColors.length];
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black font-syne flex-shrink-0"
      style={{ background: style.bg, color: style.color }}>
      {initials}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl overflow-hidden", className)}
      style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
      {children}
    </div>
  );
}
export function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
      <h3 className="font-syne font-bold text-sm">{title}</h3>
      {action}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, change, changeDir, icon }: {
  label: string; value: string | number; change?: string; changeDir?: "up" | "down"; icon: string;
}) {
  return (
    <div className="rounded-xl p-5 relative overflow-hidden" style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}>
      <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none"
        style={{ background: "radial-gradient(circle at top right, var(--accent-dim2), transparent 70%)" }} />
      <div className="absolute top-4 right-4 text-xl opacity-40">{icon}</div>
      <div className="text-xs mb-2 font-medium" style={{ color: "var(--text3)" }}>{label}</div>
      <div className="font-syne font-black text-3xl">{value}</div>
      {change && (
        <div className="text-xs mt-1" style={{ color: changeDir === "up" ? "#4caf7d" : changeDir === "down" ? "#ff5f57" : "var(--orange)" }}>
          {change}
        </div>
      )}
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="h-16 flex items-center px-7 gap-3 sticky top-0 z-40"
      style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)" }}>
      <h1 className="font-syne font-bold text-lg flex-1">{title}</h1>
      {children}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className="w-11 h-6 rounded-full relative transition-colors"
      style={{ background: checked ? "var(--accent)" : "var(--bg4)", border: checked ? "1px solid var(--accent)" : "1px solid var(--border2)" }}>
      <span className="absolute w-4.5 h-4.5 bg-white rounded-full top-0.5 transition-transform"
        style={{ width: 18, height: 18, top: 2, left: checked ? 20 : 2, position: "absolute", transition: "left 0.2s" }} />
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      className={cn("w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors font-dm", props.className)}
      style={{ background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)", ...props.style as React.CSSProperties }} />
  );
}
export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props}
      className={cn("w-full px-3 py-2.5 rounded-lg text-sm outline-none cursor-pointer font-dm", props.className)}
      style={{ background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)" }}>
      {children}
    </select>
  );
}
