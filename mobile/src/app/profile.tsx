// Profil (web: app/profile). E-posta/şifre değiştirme, yasal metinler, destek, hesap silme.
// Abonelik bittiğinde de erişilebilir (hesap silme hakkı paywall'a takılmaz).
import { useState } from "react";
import { Linking, ScrollView, View } from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { apiFetch, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { authErrorMessage } from "@/lib/auth-errors";
import { config } from "@/lib/config";
import { confirmAction } from "@/lib/confirm";
import { supabase } from "@/lib/supabase";
import { AppText, Button, Card, Divider, ErrorBanner, InfoBanner, Input, ListRow } from "@/components/ui";
import { useToast } from "@/components/toast";
import { spacing } from "@/theme";
import { useColors } from "@/lib/theme";

const LEGAL = [
  { title: "Kullanım Koşulları", path: "/kullanim-kosullari" },
  { title: "Gizlilik Politikası", path: "/gizlilik" },
  { title: "KVKK Aydınlatma Metni", path: "/aydinlatma-metni" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const { session, shop, status, signOut } = useAuth();
  const toast = useToast();
  const currentEmail = session?.user.email ?? "";

  const [email, setEmail] = useState(currentEmail);
  const [emailMsg, setEmailMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);

  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [savingPw, setSavingPw] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function changeEmail() {
    const next = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(next)) return setEmailMsg({ text: "Geçerli bir e-posta adresi girin.", ok: false });
    if (next === currentEmail) return setEmailMsg({ text: "Bu zaten mevcut e-posta adresiniz.", ok: false });
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: next }, { emailRedirectTo: `${config.siteUrl}/auth/callback` });
    setSavingEmail(false);
    setEmailMsg(
      error
        ? { text: authErrorMessage(error), ok: false }
        : { text: "Değişikliği tamamlamak için yeni adresinize gönderilen bağlantıya tıklayın.", ok: true }
    );
  }

  async function changePassword() {
    if (!oldPw || !newPw || !newPw2) return setPwMsg({ text: "Tüm şifre alanlarını doldurun.", ok: false });
    if (newPw.length < 6) return setPwMsg({ text: "Yeni şifre en az 6 karakter olmalıdır.", ok: false });
    if (newPw !== newPw2) return setPwMsg({ text: "Yeni şifreler eşleşmiyor.", ok: false });
    setSavingPw(true);
    // Mevcut şifre doğrulaması (web ile aynı yöntem)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: currentEmail, password: oldPw });
    if (signInError) {
      setSavingPw(false);
      return setPwMsg({ text: "Mevcut şifrenizi yanlış girdiniz.", ok: false });
    }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSavingPw(false);
    if (error) return setPwMsg({ text: authErrorMessage(error), ok: false });
    setOldPw("");
    setNewPw("");
    setNewPw2("");
    setPwMsg({ text: "Şifreniz güncellendi.", ok: true });
  }

  async function deleteAccount() {
    const storeSub = shop?.billing_provider === "app_store" || shop?.billing_provider === "play_store";
    const ok = await confirmAction({
      title: "Hesabınız kalıcı olarak silinsin mi?",
      message:
        "Dükkanınız, randevularınız, müşterileriniz ve personel bilgileriniz silinir. Bu işlem geri alınamaz. Ödeme kayıtları yasal yükümlülük nedeniyle saklanır." +
        (storeSub ? "\n\nUygulama mağazası aboneliğiniz otomatik iptal olmaz; App Store / Google Play abonelik ayarlarından iptal edin." : ""),
      confirmText: "Hesabımı sil",
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await apiFetch("/account", { method: "DELETE" });
      toast("Hesabınız silindi.");
      await signOut();
    } catch (e) {
      toast(errorMessage(e), "error");
      setDeleting(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
      {/* Abonelik bu ekrandayken biterse arkadaki sekmeler kalkar ve geri butonu kaybolur */}
      {status === "locked" && !router.canGoBack() ? (
        <Button title="← Abonelik ekranına dön" variant="secondary" onPress={() => router.replace("/paywall")} />
      ) : null}
      <Card style={{ gap: spacing.md }}>
        <AppText variant="heading">E-posta</AppText>
        <Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        {emailMsg ? emailMsg.ok ? <InfoBanner message={emailMsg.text} /> : <ErrorBanner message={emailMsg.text} /> : null}
        <Button title="E-postayı güncelle" variant="secondary" onPress={changeEmail} loading={savingEmail} disabled={email.trim() === currentEmail} />
      </Card>

      <Card style={{ gap: spacing.md }}>
        <AppText variant="heading">Şifre</AppText>
        <Input label="Mevcut şifre" value={oldPw} onChangeText={setOldPw} secureTextEntry autoComplete="current-password" />
        <Input label="Yeni şifre" value={newPw} onChangeText={setNewPw} secureTextEntry autoComplete="new-password" />
        <Input label="Yeni şifre (tekrar)" value={newPw2} onChangeText={setNewPw2} secureTextEntry autoComplete="new-password" />
        {pwMsg ? pwMsg.ok ? <InfoBanner message={pwMsg.text} /> : <ErrorBanner message={pwMsg.text} /> : null}
        <Button title="Şifreyi güncelle" variant="secondary" onPress={changePassword} loading={savingPw} />
      </Card>

      <Card style={{ paddingVertical: 0 }}>
        {LEGAL.map((l, i) => (
          <View key={l.path}>
            {i > 0 ? <Divider /> : null}
            <ListRow title={l.title} onPress={() => WebBrowser.openBrowserAsync(`${config.siteUrl}${l.path}`)} />
          </View>
        ))}
        <Divider />
        <ListRow title="Destek" subtitle={config.supportEmail} onPress={() => Linking.openURL(`mailto:${config.supportEmail}`)} />
      </Card>

      <Card style={{ gap: spacing.md, borderColor: colors.redBorder }}>
        <AppText variant="heading" style={{ color: colors.red }}>
          Hesabı sil
        </AppText>
        <AppText variant="small">
          Hesabınız ve dükkanınıza ait tüm veriler kalıcı olarak silinir. Sonuçlanmamış bir iade talebiniz varsa önce sonuçlanmasını bekleyin.
        </AppText>
        <Button title="Hesabımı sil" variant="danger" onPress={deleteAccount} loading={deleting} />
      </Card>
    </ScrollView>
  );
}
