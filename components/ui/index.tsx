"use client";
import { cn } from "@/lib/utils";
import { AppointmentStatus, AppointmentSource } from "@/types";
import { Loader2, type LucideIcon } from "lucide-react";

// ─── Button ──────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
}
export function Button({ variant = "primary", size = "md", loading = false, disabled, className, children, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 cursor-pointer border-0 font-dm active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100";
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  const variants = {
    primary: "bg-[var(--accent)] text-[#0a0a0a] hover:bg-[var(--accent2)] shadow-[0_0_0_1px_rgba(200,240,96,0.15)] hover:shadow-[0_0_16px_rgba(200,240,96,0.25)]",
    ghost: "bg-transparent text-[var(--text2)] border border-[var(--border2)] hover:bg-[var(--bg3)] hover:text-[var(--text)]",
    danger: "bg-[rgba(255,95,87,0.1)] text-[var(--red)] border border-[rgba(255,95,87,0.2)] hover:bg-[rgba(255,95,87,0.2)]",
  };
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} disabled={disabled || loading} aria-busy={loading} {...props}>
      {loading && <Loader2 className="animate-spin" size={size === "sm" ? 12 : 14} aria-hidden />}
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
    <div
      className={cn(
        "rounded-xl overflow-hidden border transition-colors duration-200",
        "border-[var(--border)] hover:border-[var(--accent-dim2)]",
        className
      )}
      style={{ background: "var(--bg2)", boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 1px 2px rgba(0,0,0,0.3)" }}>
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
export function StatCard({ label, value, change, changeDir, icon: Icon }: {
  label: string; value: string | number; change?: string; changeDir?: "up" | "down"; icon: LucideIcon;
}) {
  return (
    <div
      className="rounded-xl p-5 relative overflow-hidden border border-[var(--border)] hover:border-[var(--accent-dim2)] transition-colors duration-200 group"
      style={{ background: "var(--bg2)", boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05)" }}>
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "radial-gradient(circle, var(--accent-dim2), transparent 70%)" }} />
      <div className="absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center backdrop-blur-sm"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)", color: "var(--accent)" }}>
        <Icon size={16} strokeWidth={2} aria-hidden />
      </div>
      <div className="text-xs mb-2 font-medium" style={{ color: "var(--text3)" }}>{label}</div>
      <div className="font-syne font-black text-3xl tabular-nums">{value}</div>
      {change && (
        <div className="text-xs mt-1" style={{ color: changeDir === "up" ? "#4caf7d" : changeDir === "down" ? "#ff5f57" : "var(--orange)" }}>
          {change}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md", className)}
      style={{ background: "linear-gradient(90deg, var(--bg3) 0%, var(--bg4) 50%, var(--bg3) 100%)" }}
      aria-hidden
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl p-5 relative overflow-hidden border border-[var(--border)]"
      style={{ background: "var(--bg2)", boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05)" }}>
      <Skeleton className="absolute top-4 right-4 w-9 h-9 rounded-lg" />
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y" style={{ borderColor: "var(--border)" }}>
      <div className="px-4 py-3 flex gap-4" style={{ background: "var(--bg3)" }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-4 py-3.5 flex items-center gap-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2.5 flex-1">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
          </div>
          {Array.from({ length: Math.max(cols - 1, 0) }).map((_, c) => (
            <Skeleton key={c} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, actionButton }: {
  icon: LucideIcon; title: string; description?: string; actionButton?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-14">
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full blur-xl opacity-70" style={{ background: "var(--accent-dim2)" }} />
        <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--bg3)", border: "1px solid var(--border2)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)", color: "var(--accent)" }}>
          <Icon size={24} strokeWidth={1.75} aria-hidden />
        </div>
      </div>
      <h3 className="font-syne font-bold text-base mb-1.5">{title}</h3>
      {description && <p className="text-sm max-w-xs leading-relaxed" style={{ color: "var(--text3)" }}>{description}</p>}
      {actionButton && <div className="mt-6">{actionButton}</div>}
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="h-16 flex items-center px-4 sm:px-7 gap-2 sm:gap-3 sticky top-0 z-40 backdrop-blur-md"
      style={{ background: "rgba(17,17,17,0.85)", borderBottom: "1px solid var(--border)" }}>
      <h1 className="font-syne font-bold text-base sm:text-lg flex-1 truncate">{title}</h1>
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
      className={cn("w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors font-dm focus:border-[var(--accent-dim2)]", props.className)}
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
