import { useState } from "react";
import { useColors } from "@/lib/theme";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { signupSchema } from "@shared/validations";
import { supabase } from "@/lib/supabase";
import { config } from "@/lib/config";
import { authErrorMessage } from "@/lib/auth-errors";
import { AppText, Button, ErrorBanner, Input, LinkText, Screen } from "@/components/ui";

export default function SignupScreen() {
  const colors = useColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup() {
    const parsed = signupSchema.safeParse({ email: email.trim().toLowerCase(), password, passwordConfirm });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Bilgileri kontrol edin.");
      return;
    }
    if (!termsAccepted) {
      setError("Devam etmek için Kullanım Koşulları ve Gizlilik Politikası'nı onaylamanız gerekir.");
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: authError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        // E-postadaki link web'de çalışmaya devam eder; uygulama içindeki koddur
        emailRedirectTo: `${config.siteUrl}/auth/callback`,
        data: { terms_accepted_at: new Date().toISOString() },
      },
    });
    setLoading(false);
    if (authError) {
      setError(authErrorMessage(authError));
      return;
    }
    // E-posta doğrulaması kapalıysa oturum hemen açılır ve yönlendirme otomatik olur
    if (!data.session) {
      router.replace({ pathname: "/verify", params: { email: parsed.data.email, type: "signup" } });
    }
  }

  const openLegal = (path: string) => WebBrowser.openBrowserAsync(`${config.siteUrl}${path}`);

  return (
    <Screen>
      <AppText variant="title">Hesap Oluştur</AppText>
      <AppText variant="muted">7 gün ücretsiz deneyin, kart bilgisi gerekmez.</AppText>
      <ErrorBanner message={error} />
      <Input
        label="E-posta Adresi"
        value={email}
        onChangeText={setEmail}
        placeholder="isim@sirket.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <Input
        label="Şifre"
        value={password}
        onChangeText={setPassword}
        placeholder="En az 6 karakter"
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <Input
        label="Şifre (Tekrar)"
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
        placeholder="••••••••"
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: termsAccepted }}
        onPress={() => setTermsAccepted((v) => !v)}
        style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            borderWidth: 1.5,
            borderColor: termsAccepted ? colors.accent : colors.border2,
            backgroundColor: termsAccepted ? colors.accent : "transparent",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 1,
          }}
        >
          {termsAccepted ? <AppText style={{ color: colors.onAccent, fontWeight: "900", fontSize: 13 }}>✓</AppText> : null}
        </View>
        <AppText variant="muted" style={{ flex: 1 }}>
          <LinkText onPress={() => openLegal("/kullanim-kosullari")}>Kullanım Koşulları</LinkText> ve{" "}
          <LinkText onPress={() => openLegal("/gizlilik")}>Gizlilik Politikası</LinkText>{"'nı okudum, kabul ediyorum."}
        </AppText>
      </Pressable>
      <Button title="Kayıt Ol" onPress={handleSignup} loading={loading} />
      <AppText variant="muted" style={{ textAlign: "center" }}>
        Zaten hesabınız var mı? <LinkText onPress={() => router.back()}>Giriş Yap</LinkText>
      </AppText>
    </Screen>
  );
}
