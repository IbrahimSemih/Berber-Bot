import Link from "next/link";

export const metadata = {
  title: "Sayfa bulunamadı",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="font-syne font-bold text-6xl mb-4" style={{ color: "var(--accent)" }}>404</div>
      <h1 className="text-2xl font-heading font-bold mb-3">Aradığınız sayfa bulunamadı</h1>
      <p className="mb-8 max-w-md text-sm leading-relaxed" style={{ color: "var(--text2)" }}>
        Bağlantı yanlış yazılmış ya da sayfa kaldırılmış olabilir. Bir dükkanın randevu sayfasını arıyorsanız,
        bağlantıyı dükkandan tekrar isteyin.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-80"
        style={{ background: "var(--accent)", color: "var(--on-accent)" }}
      >
        Ana Sayfa
      </Link>
    </div>
  );
}
