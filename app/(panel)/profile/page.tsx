"use client";
import { useState, useEffect } from "react";
import { Card, PageHeader, Button, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { deleteAccountAction } from "./actions";
import { toast } from "react-hot-toast";
import { AlertTriangle, User, Key, Shield, Trash2, Mail, Lock } from "lucide-react";

export default function ProfilePage() {
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [userId, setUserId] = useState<string | null>(null);
  
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [emailMessage, setEmailMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession(); // yerel, ağ isteği yok; yetkiyi RLS uygular
      const user = session?.user;
      if (user) {
        setUserId(user.id);
        setEmail(user.email || "");
      }
    }
    loadUser();
  }, [supabase]);

  const handleUpdateEmail = async () => {
    setLoadingEmail(true);
    setEmailMessage(null);

    if (!email) {
      setEmailMessage({ text: "E-posta adresi boş olamaz.", type: "error" });
      setLoadingEmail(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ email });

    if (error) {
      setEmailMessage({ text: error.message, type: "error" });
    } else {
      setEmailMessage({ text: "E-posta güncelleme talebi alındı. Lütfen yeni e-posta adresinize gönderilen doğrulama bağlantısına tıklayın.", type: "success" });
    }
    setLoadingEmail(false);
  };

  const handleUpdatePassword = async () => {
    setLoadingPassword(true);
    setPasswordMessage(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ text: "Lütfen tüm şifre alanlarını doldurun.", type: "error" });
      setLoadingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: "Yeni şifreler birbiriyle eşleşmiyor.", type: "error" });
      setLoadingPassword(false);
      return;
    }

    // Verify old password
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setPasswordMessage({ text: "Kullanıcı bilgisi bulunamadı.", type: "error" });
      setLoadingPassword(false);
      return;
    }

    // Doğrulama için giriş yapmayı deniyoruz
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });

    if (signInError) {
      setPasswordMessage({ text: "Mevcut şifrenizi yanlış girdiniz.", type: "error" });
      setLoadingPassword(false);
      return;
    }

    // Şifre doğruysa güncelliyoruz
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError) {
      setPasswordMessage({ text: updateError.message, type: "error" });
    } else {
      setPasswordMessage({ text: "Şifreniz başarıyla güncellendi.", type: "success" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setLoadingPassword(false);
  };

  const handleDelete = () => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-[var(--red)] w-5 h-5" />
          <span className="font-bold">Hesap Silme İşlemi</span>
        </div>
        <p className="text-sm">Hesabınızı ve tüm dükkan/randevu verilerinizi silmek istediğinize emin misiniz? Bu işlem geri alınamaz!</p>
        <p className="text-xs opacity-70">İade hakkınız varsa, silmeden önce Fatura & Abonelik sayfasından talep edin. Ödeme ve fatura kayıtları yasal saklama yükümlülüğü nedeniyle saklanmaya devam eder.</p>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" size="sm" onClick={() => toast.dismiss(t.id)}>İptal</Button>
          <Button variant="danger" size="sm" onClick={async () => {
            toast.dismiss(t.id);
            if (!userId) return;
            setLoadingDelete(true);
            const result = await deleteAccountAction(userId);
            if (result.success) {
              window.location.href = "/login";
            } else {
              toast.error("Hesap silinemedi: " + result.error);
              setLoadingDelete(false);
            }
          }}>Evet, Hesabımı Sil</Button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  return (
    <>
      <PageHeader title="Profilim" />
      <div className="p-4 md:p-7 max-w-5xl flex flex-col gap-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium flex items-center gap-2 mb-2 text-[var(--text)]">
              <User className="w-5 h-5 text-[var(--blue)]" />
              Kişisel Bilgiler
            </h3>
            <p className="text-sm text-[var(--text3)]">
              Hesabınızla ilişkili e-posta adresinizi buradan güncelleyebilirsiniz.
            </p>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <div className="p-6 flex flex-col gap-5">
                {emailMessage && (
                  <div className={`text-sm p-4 rounded-lg flex items-start gap-3 border ${emailMessage.type === 'error' ? 'bg-[var(--red-dim)] border-[rgba(185,60,52,0.25)] text-[var(--red)]' : 'bg-[var(--green-dim)] border-[rgba(43,117,83,0.25)] text-[var(--green)]'}`}>
                    <Mail className="w-5 h-5 shrink-0" />
                    <span>{emailMessage.text}</span>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--text2)]">E-posta Adresi</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text3)]" />
                    <Input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="pl-9 w-full"
                    />
                  </div>
                </div>
                <div className="flex justify-end border-t pt-4">
                  <Button onClick={handleUpdateEmail} disabled={loadingEmail}>
                    {loadingEmail ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <hr className="border-[var(--border)]" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium flex items-center gap-2 mb-2 text-[var(--text)]">
              <Shield className="w-5 h-5 text-[var(--green)]" />
              Güvenlik
            </h3>
            <p className="text-sm text-[var(--text3)]">
              Hesabınızın güvenliğini sağlamak için şifrenizi düzenli olarak değiştirin.
            </p>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <div className="p-6 flex flex-col gap-5">
                {passwordMessage && (
                  <div className={`text-sm p-4 rounded-lg flex items-start gap-3 border ${passwordMessage.type === 'error' ? 'bg-[var(--red-dim)] border-[rgba(185,60,52,0.25)] text-[var(--red)]' : 'bg-[var(--green-dim)] border-[rgba(43,117,83,0.25)] text-[var(--green)]'}`}>
                    <Shield className="w-5 h-5 shrink-0" />
                    <span>{passwordMessage.text}</span>
                  </div>
                )}
                
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[var(--text2)]">Mevcut Şifre</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text3)]" />
                      <Input 
                        type="password" 
                        value={oldPassword} 
                        onChange={(e) => setOldPassword(e.target.value)} 
                        placeholder="••••••••" 
                        className="pl-9 w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-[var(--text2)]">Yeni Şifre</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text3)]" />
                        <Input 
                          type="password" 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                          placeholder="••••••••" 
                          className="pl-9 w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-[var(--text2)]">Yeni Şifre (Tekrar)</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text3)]" />
                        <Input 
                          type="password" 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          placeholder="••••••••" 
                          className="pl-9 w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t pt-4">
                  <Button onClick={handleUpdatePassword} disabled={loadingPassword}>
                    {loadingPassword ? "Şifre Güncelleniyor..." : "Şifreyi Güncelle"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <hr className="border-[var(--border)]" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium flex items-center gap-2 mb-2 text-[var(--red)]">
              <AlertTriangle className="w-5 h-5" />
              Hesap Yönetimi
            </h3>
            <p className="text-sm text-[var(--text3)]">
              Hesabınızı sildiğinizde, dükkanınız, müşterileriniz ve tüm randevu geçmişiniz kalıcı olarak silinecektir. Bu işlemi geri alamazsınız.
            </p>
          </div>
          
          <div className="md:col-span-2">
            <Card className="border-[rgba(185,60,52,0.25)]">
              <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Trash2 className="w-5 h-5 text-[var(--red)] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-[var(--text)]">Hesabımı Sil</h4>
                    <p className="text-sm text-[var(--text3)] mt-1">Bu işlem geri alınamaz. Lütfen emin olmadan devam etmeyin.</p>
                  </div>
                </div>
                <Button 
                  onClick={handleDelete} 
                  disabled={loadingDelete} 
                  variant="danger" 
                  className="shrink-0"
                >
                  {loadingDelete ? "Siliniyor..." : "Hesabımı Sil"}
                </Button>
              </div>
            </Card>
          </div>
        </div>

      </div>
    </>
  );
}
