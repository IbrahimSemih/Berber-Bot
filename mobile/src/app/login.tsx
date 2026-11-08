import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { authErrorMessage } from "@/lib/auth-errors";
import { AppText, Brand, Button, ErrorBanner, Input, LinkText, Screen } from "@/components/ui";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError("E-posta ve şifre zorunludur.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    setLoading(false);
    if (!authError) return; // Yönlendirme oturum değişince otomatik

    if (authError.code === "email_not_confirmed") {
      // Yeni kod gönderip doğrulama ekranına geç
      await supabase.auth.resend({ type: "signup", email: cleanEmail });
      router.push({ pathname: "/verify", params: { email: cleanEmail, type: "signup" } });
      return;
    }
    setError(authErrorMessage(authError));
  }

  return (
    <Screen contentStyle={{ justifyContent: "center" }}>
      <Brand subtitle="İşletme Yönetim Paneli" />
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
        placeholder="••••••••"
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={handleLogin}
      />
      <View style={{ alignItems: "flex-end" }}>
        <LinkText onPress={() => router.push("/forgot")}>Şifremi Unuttum</LinkText>
      </View>
      <Button title="Giriş Yap" onPress={handleLogin} loading={loading} />
      <AppText variant="muted" style={{ textAlign: "center", marginTop: 8 }}>
        Hesabınız yok mu? <LinkText onPress={() => router.push("/signup")}>Kayıt Ol</LinkText>
      </AppText>
    </Screen>
  );
}
