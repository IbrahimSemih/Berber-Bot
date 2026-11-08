// Şifre sıfırlama: e-posta → kod + yeni şifre. Supabase "Reset password" e-posta
// şablonunda {{ .Token }} bulunmalı (mobile/README.md).
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { config } from "@/lib/config";
import { authErrorMessage } from "@/lib/auth-errors";
import { AppText, Button, ErrorBanner, InfoBanner, Input, Screen } from "@/components/ui";

export default function ForgotPasswordScreen() {
  const { setHoldAuthRoutes } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function sendCode() {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError("Geçerli bir e-posta adresi giriniz.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${config.siteUrl}/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      setError(authErrorMessage(resetError));
      return;
    }
    setEmail(cleanEmail);
    setStep("code");
    setInfo("Bu adrese kayıtlı bir hesap varsa şifre sıfırlama kodu gönderildi.");
  }

  async function resetPassword() {
    const token = code.replace(/\s/g, "");
    if (!/^\d{6,10}$/.test(token)) {
      setError("E-postanıza gelen kodu girin.");
      return;
    }
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Şifreler birbiriyle eşleşmiyor.");
      return;
    }
    setLoading(true);
    setError(null);
    // Kod doğrulanınca oturum açılır; yeni şifre kaydedilene kadar bu ekranda kal
    setHoldAuthRoutes(true);
    try {
      const { error: otpError } = await supabase.auth.verifyOtp({ email, token, type: "recovery" });
      if (otpError) {
        setError(authErrorMessage(otpError));
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        // Kod kullanıldı; oturumu kapatıp baştan başlat
        await supabase.auth.signOut();
        setStep("email");
        setError(authErrorMessage(updateError));
      }
    } finally {
      setLoading(false);
      setHoldAuthRoutes(false); // Başarılıysa oturum açık: uygulamaya geçilir
    }
  }

  return (
    <Screen>
      <AppText variant="title">Şifremi Unuttum</AppText>
      <ErrorBanner message={error} />
      <InfoBanner message={info} />
      {step === "email" ? (
        <>
          <AppText variant="muted">Hesabınızın e-posta adresini girin, size bir sıfırlama kodu gönderelim.</AppText>
          <Input
            label="E-posta Adresi"
            value={email}
            onChangeText={setEmail}
            placeholder="isim@sirket.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onSubmitEditing={sendCode}
          />
          <Button title="Kod Gönder" onPress={sendCode} loading={loading} />
          <Button
            title="Kodum zaten var"
            variant="ghost"
            onPress={() => {
              const cleanEmail = email.trim().toLowerCase();
              if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
                setError("Önce e-posta adresinizi girin.");
                return;
              }
              setEmail(cleanEmail);
              setError(null);
              setStep("code");
            }}
          />
        </>
      ) : (
        <>
          <Input
            label="Sıfırlama Kodu"
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={10}
          />
          <Input
            label="Yeni Şifre"
            value={password}
            onChangeText={setPassword}
            placeholder="En az 6 karakter"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <Input
            label="Yeni Şifre (Tekrar)"
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            onSubmitEditing={resetPassword}
          />
          <Button title="Şifreyi Güncelle" onPress={resetPassword} loading={loading} />
          <Button title="Farklı e-posta / kodu tekrar gönder" variant="ghost" onPress={() => setStep("email")} />
        </>
      )}
    </Screen>
  );
}
