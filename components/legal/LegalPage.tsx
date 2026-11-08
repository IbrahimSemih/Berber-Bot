import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import { COMPANY, LEGAL_LAST_UPDATED, SITE } from "@/lib/site-config";

export function LegalPage({
  title,
  badge,
  path,
  updated = LEGAL_LAST_UPDATED,
  children,
}: {
  title: string;
  badge?: string;
  path: string;
  updated?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <nav
        style={{ borderBottom: "1px solid var(--border)", background: "rgba(10,10,10,0.8)" }}
        className="fixed top-0 left-0 right-0 h-16 flex items-center px-6 md:px-12 gap-5 z-50 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold"
            style={{ background: "var(--accent)", color: "#0a0a0a" }}>✂</div>
          <span className="font-heading font-black text-xl tracking-tight">{SITE.name}</span>
        </Link>
        <Link href="/" className="ml-auto flex items-center gap-2 text-sm font-medium transition-colors hover:text-white" style={{ color: "var(--text3)" }}>
          <ArrowLeft size={16} aria-hidden /> Ana Sayfa
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        <div className="mb-12">
          {badge && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
              style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-dim2)", color: "var(--accent)" }}>
              {badge}
            </div>
          )}
          <h1 className="font-heading font-black text-4xl md:text-5xl tracking-tight mb-4">{title}</h1>
          {updated && (
            <p className="text-base font-light" style={{ color: "var(--text3)" }}>Son güncelleme: {updated}</p>
          )}
        </div>

        <article className="flex flex-col gap-10 text-base leading-relaxed" style={{ color: "var(--text2)" }}>
          {children}
        </article>
      </main>

      <SiteFooter current={path} />
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-heading font-bold text-xl md:text-2xl mb-4 text-white">{title}</h2>
      {children}
    </section>
  );
}

export function Box({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "warn" }) {
  return (
    <div className="mt-3 rounded-xl border p-5 text-sm flex flex-col gap-2"
      style={tone === "warn"
        ? { background: "rgba(255,95,87,0.05)", borderColor: "rgba(255,95,87,0.15)" }
        : { background: "var(--bg2)", borderColor: "var(--border)" }}>
      {children}
    </div>
  );
}

export function CompanyInfo({ includeKvkk = false }: { includeKvkk?: boolean }) {
  return (
    <Box>
      <div><strong className="text-white">Unvan:</strong> {COMPANY.legalName}</div>
      <div><strong className="text-white">Adres:</strong> {COMPANY.address}</div>
      <div><strong className="text-white">Vergi Dairesi / No:</strong> {COMPANY.taxOffice} / {COMPANY.taxNumber}</div>
      {COMPANY.mersisNo && <div><strong className="text-white">MERSİS No:</strong> {COMPANY.mersisNo}</div>}
      <div><strong className="text-white">Telefon:</strong> {COMPANY.phone}</div>
      <div><strong className="text-white">E-posta:</strong> <a className="underline" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></div>
      {includeKvkk && (
        <div><strong className="text-white">KVKK Başvuru:</strong> <a className="underline" href={`mailto:${COMPANY.kvkkEmail}`}>{COMPANY.kvkkEmail}</a></div>
      )}
      {COMPANY.kepAddress && <div><strong className="text-white">KEP:</strong> {COMPANY.kepAddress}</div>}
    </Box>
  );
}

export const ul = "list-disc pl-6 mt-3 flex flex-col gap-2";
