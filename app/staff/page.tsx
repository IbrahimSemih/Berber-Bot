"use client";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, PageHeader, Button, Avatar } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { Staff } from "@/types";
import StaffModal from "./StaffModal";

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState("");
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

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

  const handleDelete = async (id: string) => {
    if (!confirm("Bu personeli silmek istediğinize emin misiniz? (Personelin geçmiş randevuları 'Fark Etmez' olarak kalacaktır)")) return;
    await supabase.from("staff").delete().eq("id", id);
    loadData();
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
                {["Personel", "Telefon", "Durum", "İşlemler"].map((h) => (
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
                      {s.is_active ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-500">Aktif</span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-500">Pasif</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
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
    </AdminLayout>
  );
}
