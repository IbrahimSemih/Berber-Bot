"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Button, Input } from "@/components/ui";
import { saveBillingProfile } from "./billingProfileActions";
import type { BillingProfile } from "@/lib/checkout";

type FormState = {
  type: "individual" | "corporate";
  full_name: string;
  company_name: string;
  identity_number: string;
  tax_office: string;
  tax_number: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  zip_code: string;
};

function toForm(p: Partial<BillingProfile> | null): FormState {
  return {
    type: p?.type === "corporate" ? "corporate" : "individual",
    full_name: p?.full_name ?? "",
    company_name: p?.company_name ?? "",
    identity_number: p?.identity_number ?? "",
    tax_office: p?.tax_office ?? "",
    tax_number: p?.tax_number ?? "",
    phone: p?.phone ?? "",
    address: p?.address ?? "",
    city: p?.city ?? "",
    district: p?.district ?? "",
    zip_code: p?.zip_code ?? "",
  };
}

export default function BillingProfileForm({ initial, complete }: { initial: Partial<BillingProfile> | null; complete: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toForm(initial));
  const [editing, setEditing] = useState(!complete);
  const [saving, setSaving] = useState(false);
  const [errorField, setErrorField] = useState<string | null>(null);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errorField === key) setErrorField(null);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await saveBillingProfile(form);
      if (result.success) {
        toast.success("Fatura bilgileriniz kaydedildi.");
        setEditing(false);
        setErrorField(null);
        router.refresh();
      } else {
        toast.error(result.error);
        setErrorField(result.field ?? null);
      }
    } catch {
      toast.error("Kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  const label = "block text-xs font-semibold uppercase tracking-wide mb-1.5";
  const ring = (key: string) => (errorField === key ? { outline: "1px solid var(--red)", borderRadius: 8 } : undefined);

  if (!editing && complete) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-sm" style={{ color: "var(--text2)" }}>
          <div className="font-medium" style={{ color: "var(--text)" }}>
            {form.type === "corporate" ? form.company_name : form.full_name}
          </div>
          <div>
            {form.type === "corporate" ? `${form.tax_office} V.D. · VKN ${form.tax_number}` : `T.C. ${form.identity_number.slice(0, 3)}••••••${form.identity_number.slice(-2)}`}
          </div>
          <div>{[form.address, form.district, form.city].filter(Boolean).join(", ")}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Düzenle</Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="inline-flex p-1 rounded-lg self-start border" style={{ borderColor: "var(--border)", background: "var(--bg3)" }} role="group" aria-label="Fatura tipi">
        {([["individual", "Bireysel / Şahıs"], ["corporate", "Kurumsal (Şirket)"]] as const).map(([value, text]) => (
          <button key={value} type="button" onClick={() => setForm((f) => ({ ...f, type: value }))} aria-pressed={form.type === value}
            className="px-4 py-1.5 rounded-md text-xs font-bold transition-colors"
            style={form.type === value ? { background: "var(--accent)", color: "#0a0a0a" } : { color: "var(--text2)" }}>
            {text}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div style={ring("full_name")}>
          <label className={label} style={{ color: "var(--text3)" }}>{form.type === "corporate" ? "Yetkili Ad Soyad" : "Ad Soyad"} *</label>
          <Input value={form.full_name} onChange={set("full_name")} maxLength={120} autoComplete="name" />
        </div>
        <div style={ring("phone")}>
          <label className={label} style={{ color: "var(--text3)" }}>Cep Telefonu *</label>
          <Input type="tel" value={form.phone} onChange={set("phone")} placeholder="532 123 45 67" autoComplete="tel" />
        </div>
      </div>

      {form.type === "individual" ? (
        <div style={ring("identity_number")}>
          <label className={label} style={{ color: "var(--text3)" }}>T.C. Kimlik No *</label>
          <Input value={form.identity_number} onChange={set("identity_number")} inputMode="numeric" maxLength={11} />
          <p className="text-[11px] mt-1" style={{ color: "var(--text3)" }}>e-Arşiv fatura düzenlenebilmesi ve ödeme kuruluşu mevzuatı gereği istenir.</p>
        </div>
      ) : (
        <>
          <div style={ring("company_name")}>
            <label className={label} style={{ color: "var(--text3)" }}>Şirket Unvanı *</label>
            <Input value={form.company_name} onChange={set("company_name")} maxLength={200} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div style={ring("tax_office")}>
              <label className={label} style={{ color: "var(--text3)" }}>Vergi Dairesi *</label>
              <Input value={form.tax_office} onChange={set("tax_office")} maxLength={120} />
            </div>
            <div style={ring("tax_number")}>
              <label className={label} style={{ color: "var(--text3)" }}>Vergi Kimlik No *</label>
              <Input value={form.tax_number} onChange={set("tax_number")} inputMode="numeric" maxLength={10} />
            </div>
          </div>
        </>
      )}

      <div style={ring("address")}>
        <label className={label} style={{ color: "var(--text3)" }}>Fatura Adresi *</label>
        <Input value={form.address} onChange={set("address")} maxLength={400} placeholder="Mahalle, cadde/sokak, no, daire" autoComplete="street-address" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div style={ring("district")}>
          <label className={label} style={{ color: "var(--text3)" }}>İlçe</label>
          <Input value={form.district} onChange={set("district")} maxLength={60} />
        </div>
        <div style={ring("city")}>
          <label className={label} style={{ color: "var(--text3)" }}>İl *</label>
          <Input value={form.city} onChange={set("city")} maxLength={60} />
        </div>
        <div style={ring("zip_code")}>
          <label className={label} style={{ color: "var(--text3)" }}>Posta Kodu</label>
          <Input value={form.zip_code} onChange={set("zip_code")} inputMode="numeric" maxLength={10} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" loading={saving}>Fatura Bilgilerini Kaydet</Button>
        {complete && <Button type="button" variant="ghost" onClick={() => { setForm(toForm(initial)); setEditing(false); }}>Vazgeç</Button>}
      </div>
    </form>
  );
}
