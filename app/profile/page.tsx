"use client";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardHeader, PageHeader, Button, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { deleteAccountAction } from "./actions";

export default function ProfilePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setEmail(user.email || "");
      }
    }
    loadUser();
  }, [supabase]);

  const handleUpdate = async () => {
    setLoading(true);
    setMessage(null);

    const updates: { email?: string; password?: string } = {};
    if (email) updates.email = email;
    if (password) updates.password = password;

    const { error } = await supabase.auth.updateUser(updates);

    if (error) {
      setMessage({ text: error.message, type: "error" });
    } else {
      setMessage({ text: "Profiliniz başarıyla güncellendi.", type: "success" });
      setPassword(""); // Clear password field
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (confirm("Hesabınızı ve tüm dükkan/randevu verilerinizi silmek istediğinize emin misiniz? Bu işlem geri alınamaz!")) {
      if (!userId) return;
      setLoading(true);
      const result = await deleteAccountAction(userId);
      if (result.success) {
        window.location.href = "/login";
      } else {
        setMessage({ text: "Hesap silinemedi: " + result.error, type: "error" });
        setLoading(false);
      }
    }
  };

  return (
    <AdminLayout>
      <PageHeader title="Profilim" />
      <div className="p-7 max-w-2xl flex flex-col gap-5">
        <Card>
          <CardHeader title="Hesap Bilgileri" />
          <div className="p-5 flex flex-col gap-4">
            {message && (
              <div className={`text-sm p-3 rounded-lg border ${message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
                {message.text}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text3)" }}>E-posta Adresi</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text3)" }}>Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button onClick={handleUpdate} disabled={loading} className="self-start">
              {loading ? "Kaydediliyor..." : "Bilgilerimi Güncelle"}
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Tehlikeli Bölge" />
          <div className="p-5 flex flex-col gap-4 border-t-4 border-red-500 rounded-b-xl">
            <p className="text-sm" style={{ color: "var(--text2)" }}>
              Hesabınızı sildiğinizde, dükkanınız, müşterileriniz ve tüm randevu geçmişiniz kalıcı olarak silinecektir. Bu işlemi geri alamazsınız.
            </p>
            <Button onClick={handleDelete} disabled={loading} variant="danger" className="self-start bg-red-500 text-white hover:bg-red-600">
              Hesabımı Sil
            </Button>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
