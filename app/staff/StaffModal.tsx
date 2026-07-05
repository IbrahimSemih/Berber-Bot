"use client";
import { useState } from "react";
import { Button, Input, Toggle } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { Staff } from "@/types";

interface Props {
  shopId: string;
  existingStaff?: Staff | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StaffModal({ shopId, existingStaff, onClose, onSuccess }: Props) {
  const [name, setName] = useState(existingStaff?.name || "");
  const [phone, setPhone] = useState(existingStaff?.phone || "");
  const [isActive, setIsActive] = useState(existingStaff ? existingStaff.is_active : true);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  async function handleSave() {
    if (!name.trim()) { setError("Personel adı zorunludur."); return; }
    
    setSaving(true);
    setError("");

    try {
      const payload = {
        shop_id: shopId,
        name: name.trim(),
        phone: phone.trim() || null,
        is_active: isActive
      };

      if (existingStaff) {
        const { error: updErr } = await supabase
          .from("staff")
          .update(payload)
          .eq("id", existingStaff.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase
          .from("staff")
          .insert(payload);
        if (insErr) throw insErr;
      }

      onSuccess();
    } catch (e: any) {
      setError(e.message ?? "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rounded-2xl p-7 w-[400px] max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--bg2)", border: "1px solid var(--border2)" }}>
        <h2 className="font-syne font-black text-xl mb-1">{existingStaff ? "Personel Düzenle" : "Yeni Personel Ekle"}</h2>
        <p className="text-sm mb-6" style={{ color: "var(--text3)" }}>
          {existingStaff ? "Personel bilgilerini güncelle" : "Dükkanınıza yeni bir çalışan ekleyin"}
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text3)" }}>Ad Soyad *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Ahmet Usta" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text3)" }}>Telefon Numarası (Opsiyonel)</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 5XX XXX XX XX" />
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--bg3)", border: "1px solid var(--border2)" }}>
            <div>
              <div className="text-sm font-medium">Aktif mi?</div>
              <div className="text-xs" style={{ color: "var(--text3)" }}>Pasife alınan personeller randevu alamaz.</div>
            </div>
            <Toggle checked={isActive} onChange={setIsActive} />
          </div>

          {error && <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(255,95,87,0.1)", color: "var(--red)" }}>{error}</div>}
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button variant="ghost" onClick={onClose}>İptal</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet"}</Button>
        </div>
      </div>
    </div>
  );
}
