"use client";
import { useState, useEffect } from "react";
import { Button, Input } from "@/components/ui";
import { Staff, StaffLeave } from "@/types";
import { getStaffLeaves, addStaffLeave, deleteStaffLeave } from "./leaveActions";

interface Props {
  shopId: string;
  staff: Staff;
  onClose: () => void;
}

export default function StaffLeaveModal({ shopId, staff, onClose }: Props) {
  const [leaves, setLeaves] = useState<StaffLeave[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadLeaves = async () => {
    setLoading(true);
    const res = await getStaffLeaves(shopId, staff.id);
    if (res.success && res.data) {
      setLeaves(res.data as StaffLeave[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLeaves();
  }, [shopId, staff.id]);

  async function handleAdd() {
    if (!startDate || !endDate) {
      setError("Lütfen başlangıç ve bitiş tarihlerini seçiniz.");
      return;
    }
    setSaving(true);
    setError("");

    const res = await addStaffLeave(shopId, staff.id, startDate, endDate);
    if (res.success) {
      setStartDate("");
      setEndDate("");
      loadLeaves();
    } else {
      setError(res.error || "İzin eklenirken hata oluştu.");
    }
    setSaving(false);
  }

  async function handleDelete(leaveId: string) {
    if (!confirm("Bu izni silmek istediğinize emin misiniz?")) return;
    const res = await deleteStaffLeave(leaveId);
    if (res.success) {
      loadLeaves();
    } else {
      alert("Silinirken hata oluştu: " + res.error);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rounded-2xl p-7 w-[500px] max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--bg2)", border: "1px solid var(--border2)" }}>
        <h2 className="font-syne font-black text-xl mb-1">İzin Takvimi: {staff.name}</h2>
        <p className="text-sm mb-6" style={{ color: "var(--text3)" }}>
          Bu personelin ileri tarihli izinlerini buradan yönetebilirsiniz. İzinli günlerde randevu alınamaz.
        </p>

        <div className="flex flex-col gap-4 mb-8">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text3)" }}>Başlangıç Tarihi</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text3)" }}>Bitiş Tarihi</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          
          {error && <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(255,95,87,0.1)", color: "var(--red)" }}>{error}</div>}
          
          <Button onClick={handleAdd} disabled={saving || !startDate || !endDate}>
            {saving ? "Ekleniyor..." : "+ İzin Ekle"}
          </Button>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text3)" }}>Mevcut İzinler</h3>
          {loading ? (
            <p className="text-sm text-neutral-400">Yükleniyor...</p>
          ) : leaves.length === 0 ? (
            <div className="p-4 rounded-lg text-center text-sm" style={{ background: "var(--bg3)", color: "var(--text3)", border: "1px solid var(--border2)" }}>
              Kayıtlı izin bulunmuyor.
            </div>
          ) : (
            <ul className="space-y-2">
              {leaves.map((leave) => {
                const start = new Date(leave.start_date).toLocaleDateString("tr-TR");
                const end = new Date(leave.end_date).toLocaleDateString("tr-TR");
                const isPast = new Date(leave.end_date) < new Date();
                return (
                  <li key={leave.id} className="flex items-center justify-between p-3 rounded-lg border transition-colors"
                    style={{ background: "var(--bg3)", borderColor: "var(--border2)" }}>
                    <div>
                      <div className={`text-sm font-medium ${isPast ? 'text-neutral-500 line-through' : 'text-white'}`}>
                        {start} - {end}
                      </div>
                      {isPast && <div className="text-xs text-neutral-500">Geçmiş İzin</div>}
                    </div>
                    <button 
                      onClick={() => handleDelete(leave.id)}
                      className="text-xs text-red-500 hover:text-red-400 font-medium px-2 py-1 bg-red-500/10 rounded"
                    >
                      Sil
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="ghost" onClick={onClose}>Kapat</Button>
        </div>
      </div>
    </div>
  );
}
