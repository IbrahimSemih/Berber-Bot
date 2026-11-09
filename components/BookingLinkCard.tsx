"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { toast } from "react-hot-toast";
import { Copy, Download, Printer, ExternalLink } from "lucide-react";
import { Button, Card, CardHeader } from "@/components/ui";
import { updateShopSlug } from "@/app/settings/actions";
import { slugify, validateSlug } from "@/lib/slug";

// Yazarken tire/boşluk bırakılabilsin diye sondaki ayırıcı korunur
function toSlugInput(value: string) {
  const base = slugify(value);
  return base && /[\s-]$/.test(value) ? `${base}-` : base;
}

export default function BookingLinkCard({ initialSlug, shopName }: { initialSlug: string; shopName: string }) {
  const [slug, setSlug] = useState(initialSlug);
  const [draft, setDraft] = useState(initialSlug);
  const [origin, setOrigin] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setOrigin((process.env.NEXT_PUBLIC_APP_URL || window.location.origin).trim().replace(/\/$/, ""));
  }, []);

  const url = origin ? `${origin}/${slug}` : "";

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { width: 640, margin: 2, errorCorrectionLevel: "M" })
      .then(setQrDataUrl)
      .catch((e) => console.error("QR oluşturulamadı:", e));
  }, [url]);

  const draftError = draft !== slug ? validateSlug(draft) : null;

  async function save() {
    if (draftError) {
      toast.error(draftError);
      return;
    }
    setSaving(true);
    try {
      const result = await updateShopSlug(draft);
      if (result.success) {
        setSlug(result.slug);
        setDraft(result.slug);
        toast.success("Randevu linkiniz güncellendi. Eski link artık çalışmaz.");
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Link güncellenemedi.");
    } finally {
      setSaving(false);
    }
  }

  function copy() {
    if (!url) return;
    navigator.clipboard.writeText(url).then(
      () => toast.success("Link kopyalandı!"),
      () => toast.error("Kopyalanamadı.")
    );
  }

  function downloadQr() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${slug}-randevu-qr.png`;
    a.click();
  }

  return (
    <Card>
      <CardHeader title="Randevu Linki & QR Kod" />
      <div className="p-5 flex flex-col sm:flex-row gap-6">
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text3)" }}>Link</label>
            <div className="flex items-stretch rounded-lg overflow-hidden border" style={{ borderColor: "var(--border2)" }}>
              <span className="px-3 flex items-center text-xs whitespace-nowrap" style={{ background: "var(--bg3)", color: "var(--text3)" }}>
                {origin.replace(/^https?:\/\//, "") || "…"}/
              </span>
              <input
                value={draft}
                maxLength={40}
                onChange={(e) => setDraft(toSlugInput(e.target.value))}
                className="flex-1 min-w-0 px-3 py-2 text-sm outline-none"
                style={{ background: "var(--bg)", color: "var(--text)" }}
                aria-label="Randevu linki"
              />
            </div>
            {draftError ? (
              <p className="text-xs mt-1.5" style={{ color: "var(--red)" }}>{draftError}</p>
            ) : (
              <p className="text-xs mt-1.5" style={{ color: "var(--text3)" }}>
                Instagram biyografinize, Google İşletme profilinize ve WhatsApp durumunuza bu linki ekleyin.
              </p>
            )}
            {draft !== slug && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={save} loading={saving} disabled={!!draftError}>Linki Kaydet</Button>
                <Button size="sm" variant="ghost" onClick={() => setDraft(slug)}>Vazgeç</Button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={copy} disabled={!url}><Copy size={13} aria-hidden /> Kopyala</Button>
            <a href={`/${slug}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors hover:bg-[var(--bg3)]"
              style={{ borderColor: "var(--border2)", color: "var(--text2)" }}>
              <ExternalLink size={13} aria-hidden /> Sayfayı Aç
            </a>
            <Button size="sm" variant="ghost" onClick={downloadQr} disabled={!qrDataUrl}><Download size={13} aria-hidden /> QR İndir</Button>
            <Link href="/settings/qr" target="_blank"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors hover:bg-[var(--bg3)]"
              style={{ borderColor: "var(--border2)", color: "var(--text2)" }}>
              <Printer size={13} aria-hidden /> Afiş Yazdır
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="w-36 h-36 rounded-xl overflow-hidden bg-white flex items-center justify-center">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt={`${shopName} randevu QR kodu`} className="w-full h-full" />
            ) : (
              <span className="text-xs text-[var(--text3)]">QR hazırlanıyor…</span>
            )}
          </div>
          <span className="text-[11px]" style={{ color: "var(--text3)" }}>Tezgaha / aynaya asın</span>
        </div>
      </div>
    </Card>
  );
}
