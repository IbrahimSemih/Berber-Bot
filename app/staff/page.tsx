"use client";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, PageHeader, Button, Avatar } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { Staff } from "@/types";
import StaffModal from "./StaffModal";
import StaffLeaveModal from "./StaffLeaveModal";

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState("");
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveStaff, setLeaveStaff] = useState<Staff | null>(null);

  const supabase = createClient();

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }
    const { data: shop } = await supabase.from("shops").select("id").eq("owner_id", user.id).single();
    if (!shop) { setLoading(false); return; }
    
    setShopId(shop.id);

    const { data: staffData } = await supabase
      .from("staff")
      .select("*")
      .eq("shop_id", shop.id)
      .order("created_at", { ascending: true });

    if (staffData) {
      setStaffList(staffData);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewModal = () => {
    setEditingStaff(null);
    setModalOpen(true);
  };

  const openEditModal = (staff: Staff) => {
    setEditingStaff(staff);
    setModalOpen(true);
  };

  const openLeaveModal = (staff: Staff) => {
    setLeaveStaff(staff);
    setLeaveModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu personeli silmek istediğinize emin misiniz? (Personelin geçmiş randevuları 'Fark Etmez' olarak kalacaktır)")) return;
    await supabase.from("staff").delete().eq("id", id);
    loadData();
  };

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    // Optimistic UI update
    setStaffList(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
    
    // DB Update
    const { error } = await supabase.from("staff").update({ is_active: !currentStatus }).eq("id", id);
    if (error) {
      alert("Durum güncellenirken bir hata oluştu: " + error.message);
      loadData(); // Revert on error
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-7">Yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader title="Personeller">
        <Button onClick={openNewModal}>+ Yeni Personel</Button>
      </PageHeader>
      
      <div className="p-7">
        <Card>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--bg3)" }}>
                {["Personel", "Telefon", "Müsaitlik Durumu", "İşlemler"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide"
                    style={{ color: "var(--text3)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: "var(--text3)" }}>
                    Henüz personel eklenmemiş.
                  </td>
                </tr>
              ) : (
                staffList.map((s, i) => (
                  <tr key={s.id} className="border-b transition-colors" style={{ borderColor: "var(--border)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg3)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={s.name} index={i} />
                        <div className="text-sm font-medium">{s.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text3)" }}>{s.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div 
                          onClick={() => handleToggleAvailability(s.id, s.is_active)}
                          className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors ${
                            s.is_active ? 'bg-green-500' : 'bg-neutral-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              s.is_active ? 'translate-x-4.5 bg-white shadow-sm' : 'translate-x-1'
                            }`}
                          />
                        </div>
                        {s.is_active ? (
                          <span className="text-xs font-medium text-green-500">Çalışıyor</span>
                        ) : (
                          <span className="text-xs font-medium text-neutral-400">İzinli / Müsait Değil</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openLeaveModal(s)}>İzin Takvimi</Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(s)}>Düzenle</Button>
                        <Button variant="danger" size="sm" onClick={() => handleDelete(s.id)}>Sil</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {modalOpen && (
        <StaffModal 
          shopId={shopId} 
          existingStaff={editingStaff}
          onClose={() => setModalOpen(false)} 
          onSuccess={() => {
            setModalOpen(false);
            loadData();
          }} 
        />
      )}

      {leaveModalOpen && leaveStaff && (
        <StaffLeaveModal 
          shopId={shopId}
          staff={leaveStaff}
          onClose={() => setLeaveModalOpen(false)}
        />
      )}
    </AdminLayout>
  );
}
