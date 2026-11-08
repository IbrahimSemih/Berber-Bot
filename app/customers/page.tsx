"use client";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, PageHeader, Avatar, Button } from "@/components/ui";
import toast from "react-hot-toast";
import { anonymizeCustomer } from "./actions";
import { formatPrice } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Customer } from "@/types";

const isAnonymized = (c: Customer) => c.phone?.startsWith("silindi-");

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Excel (Türkçe) uyumlu CSV: UTF-8 BOM + noktalı virgül ayırıcı */
function exportCustomersCsv(rows: Customer[]) {
  const header = ["Ad Soyad", "Telefon", "Toplam Randevu", "Son Ziyaret", "Favori Hizmet", "Toplam Harcama (TL)", "Kayıt Tarihi"];
  const lines = rows
    .filter((c) => !isAnonymized(c))
    .map((c) => [
      c.name || "",
      c.phone,
      c.total_appointments ?? 0,
      c.last_visit ?? "",
      c.favorite_service ?? "",
      c.total_spent ?? 0,
      c.created_at ? new Date(c.created_at).toLocaleDateString("tr-TR") : "",
    ].map(csvCell).join(";"));
  const blob = new Blob(["\uFEFF" + [header.join(";"), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `musteriler-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CustomersPage() {
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const { data: shop } = await supabase.from("shops").select("id").eq("owner_id", user.id).single();
      if (!shop) { setLoading(false); return; }
      
      const shopId = shop.id;

      const { data: customersData } = await supabase.from("customers").select("*").eq("shop_id", shopId).order("created_at", { ascending: false });
      const { data: appointmentsData } = await supabase.from("appointments").select(`
        id, customer_id, status, scheduled_at,
        service:services(name, price)
      `).eq("shop_id", shopId);

      if (customersData && appointmentsData) {
        const enhancedCustomers = customersData.map(c => {
          const c_appointments = appointmentsData.filter(a => a.customer_id === c.id && a.status !== "cancelled");
          const total_appointments = c_appointments.length;
          
          let total_spent = 0;
          const serviceCounts: Record<string, number> = {};
          let last_visit: string | undefined = undefined;
          let last_date = 0;

          c_appointments.forEach(a => {
            if (a.service) {
              const srv: any = Array.isArray(a.service) ? a.service[0] : a.service;
              if (srv) {
                // Sadece tamamlanmış randevuların ücretini topla (veya test için hepsini)
                if (a.status === "completed" || a.status === "confirmed") {
                  total_spent += Number(srv.price || 0);
                }
                const sName = srv.name;
                serviceCounts[sName] = (serviceCounts[sName] || 0) + 1;
              }
            }
            
            const aDate = new Date(a.scheduled_at).getTime();
            // Eğer geçmişteyse (veya gelecekte değilse) son ziyareti hesapla
            if (aDate > last_date && aDate < Date.now()) {
              last_date = aDate;
              last_visit = new Date(a.scheduled_at).toLocaleDateString("tr-TR");
            }
          });

          let favorite_service = "—";
          let maxCount = 0;
          for (const [sName, count] of Object.entries(serviceCounts)) {
            if (count > maxCount) {
              maxCount = count;
              favorite_service = sName;
            }
          }

          return {
            ...c,
            total_appointments,
            total_spent,
            last_visit: last_visit || "—",
            favorite_service
          } as Customer;
        });
        setCustomers(enhancedCustomers);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleAnonymize = (customer: Customer) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <span className="font-bold">Müşteri verilerini sil</span>
        <p className="text-sm">
          {customer.name || "Bu müşteri"} için ad ve telefon kalıcı olarak silinecek, ileri tarihli randevuları iptal edilecek.
          Randevu geçmişi istatistiklerde isimsiz olarak kalır. Bu işlem geri alınamaz.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => toast.dismiss(t.id)}>Vazgeç</Button>
          <Button variant="danger" size="sm" onClick={async () => {
            toast.dismiss(t.id);
            const result = await anonymizeCustomer(customer.id);
            if (result.success) {
              setCustomers((prev) => prev.map((c) => c.id === customer.id
                ? { ...c, name: "Silinmiş müşteri", phone: `silindi-${c.id}` }
                : c));
              toast.success("Müşteri verileri silindi.");
            } else {
              toast.error(result.error || "İşlem başarısız oldu.");
            }
          }}>Evet, sil</Button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const filtered = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.includes(query)
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-7">Yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader title="Müşteriler">
        <Button variant="ghost" size="sm" onClick={() => exportCustomersCsv(customers)} disabled={customers.length === 0}>
          Excel&apos;e aktar (CSV)
        </Button>
      </PageHeader>
      <div className="p-7">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg mb-5"
          style={{ background: "var(--bg3)", border: "1px solid var(--border2)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text3)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm flex-1 font-dm"
            style={{ color: "var(--text)" }} placeholder="İsim veya telefon ara..." />
        </div>

        <Card>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--bg3)" }}>
                {["Müşteri", "WhatsApp", "Toplam Randevu", "Son Ziyaret", "Favori Hizmet", "Toplam Harcama", ""].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide"
                    style={{ color: "var(--text3)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: "var(--text3)" }}>
                    Kayıtlı müşteri bulunamadı.
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <tr key={c.id} className="border-b transition-colors" style={{ borderColor: "var(--border)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg3)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.name && c.name !== "İsimsiz" ? c.name : "?"} index={i} />
                        <div className="text-sm font-medium">{c.name || "İsimsiz"}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text3)" }}>{isAnonymized(c) ? "—" : c.phone}</td>
                    <td className="px-4 py-3 font-syne font-bold text-sm">{c.total_appointments ?? 0}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: "var(--text3)" }}>{c.last_visit ?? "—"}</td>
                    <td className="px-4 py-3 text-sm">{c.favorite_service ?? "—"}</td>
                    <td className="px-4 py-3 font-syne font-bold text-sm" style={{ color: "var(--accent)" }}>
                      {c.total_spent ? formatPrice(c.total_spent) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isAnonymized(c) && (
                        <button
                          onClick={() => handleAnonymize(c)}
                          className="text-xs underline-offset-2 hover:underline"
                          style={{ color: "var(--text3)" }}
                          title="KVKK kapsamında müşterinin kişisel verilerini sil"
                        >
                          Verileri sil
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </AdminLayout>
  );
}
