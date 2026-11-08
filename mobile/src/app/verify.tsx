// E-posta doğrulama kodu (kayıt). Supabase "Confirm signup" e-posta şablonunda
// {{ .Token }} bulunmalı (mobile/README.md).
import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { authErrorMessage } from "@/lib/auth-errors";
import { AppText, Button, ErrorBanner, InfoBanner, Input, Screen } from "@/components/ui";

const CODE_RE = /^\d{6,10}$/;

export default function VerifyScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === "string" ? params.email : "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!email) {
    return (
      <Screen>
        <ErrorBanner message="E-posta adresi bulunamadı. Lütfen tekrar kayıt olun veya giriş yapın." />
        <Button title="Giriş ekranına dön" onPress={() => router.replace("/login")} />
      </Screen>
    );
  }

  async function handleVerify() {
    const token = code.replace(/\s/g, "");
    if (!CODE_RE.test(token)) {
      setError("E-postanıza gelen kodu girin.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: otpError } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
    setLoading(false);
    // Başarılıysa oturum açılır; yönlendirme (dükkan kurulumu) otomatik
    if (otpError) setError(authErrorMessage(otpError));
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    if (resendError) setError(authErrorMessage(resendError));
    else setInfo("Yeni kod gönderildi. Gelen kutunuzu ve gereksiz klasörünü kontrol edin.");
  }

  return (
    <Screen>
      <AppText variant="title">E-postanızı doğrulayın</AppText>
      <AppText variant="muted">
        {email} adresine bir doğrulama kodu gönderdik. Kodu aşağıya girin.
      </AppText>
      <ErrorBanner message={error} />
      <InfoBanner message={info} />
      <Input
        label="Doğrulama Kodu"
        value={code}
        onChangeText={setCode}
        placeholder="123456"
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={10}
        onSubmitEditing={handleVerify}
      />
      <Button title="Doğrula" onPress={handleVerify} loading={loading} />
      <Button title="Kodu tekrar gönder" variant="ghost" onPress={handleResend} loading={resending} />
    </Screen>
  );
}
