import Link from "next/link";
import { COMPANY, SITE } from "@/lib/site-config";

const LINKS: { href: string; label: string }[] = [
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/iletisim", label: "İletişim" },
  { href: "/rehber", label: "Kullanım Rehberi" },
  { href: "/kullanim-kosullari", label: "Kullanım Koşulları" },
  { href: "/gizlilik", label: "Gizlilik Politikası" },
  { href: "/aydinlatma-metni", label: "KVKK Aydınlatma Metni" },
  { href: "/mesafeli-satis-sozlesmesi", label: "Mesafeli Satış Sözleşmesi" },
  { href: "/on-bilgilendirme-formu", label: "Ön Bilgilendirme Formu" },
  { href: "/iptal-ve-iade", label: "İptal ve İade" },
];

export default function SiteFooter({ current }: { current?: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="px-6 md:px-20 py-12 border-t" style={{ borderColor: "var(--border)", background: "var(--bg2)" }}>
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-start gap-8 md:justify-between">
          <div className="flex flex-col gap-3 max-w-sm">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                style={{ background: "var(--accent)", color: "var(--on-accent)" }}>✂</div>
              <span className="font-heading font-bold text-lg text-[var(--text)]">{SITE.name}</span>
            </Link>
            <p className="text-sm" style={{ color: "var(--text3)" }}>{SITE.tagline}.</p>
          </div>
          <nav aria-label="Alt menü" className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 text-sm font-medium" style={{ color: "var(--text3)" }}>
            {LINKS.map((l) =>
              l.href === current ? (
                <span key={l.href} className="text-[var(--text)]">{l.label}</span>
              ) : (
                <Link key={l.href} href={l.href} className="hover:text-[var(--text)] transition-colors">{l.label}</Link>
              )
            )}
          </nav>
        </div>
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between text-xs pt-6 border-t" style={{ color: "var(--text3)", borderColor: "var(--border)" }}>
          <div>© {year} {COMPANY.legalName} · {SITE.name}</div>
          <div>Ödemeler iyzico güvencesiyle alınır · Kredi kartı / banka kartı</div>
        </div>
      </div>
    </footer>
  );
}
