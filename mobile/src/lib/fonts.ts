// Uygulama yazı tipleri (web ile aynı): başlıklar Fraunces 600/700, gövde ve
// panel Plus Jakarta Sans 400-700. Yalnızca kullanılan ağırlıklar ayrı yollardan
// içe aktarılır; diğer ağırlıklar uygulama paketine girmez.
import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces/600SemiBold";
import { Fraunces_700Bold } from "@expo-google-fonts/fraunces/700Bold";
import { PlusJakartaSans_400Regular } from "@expo-google-fonts/plus-jakarta-sans/400Regular";
import { PlusJakartaSans_500Medium } from "@expo-google-fonts/plus-jakarta-sans/500Medium";
import { PlusJakartaSans_600SemiBold } from "@expo-google-fonts/plus-jakarta-sans/600SemiBold";
import { PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans/700Bold";

/** expo-font useFonts'a verilecek harita (kök yerleşimde yüklenir) */
export const fontAssets = {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
};

/**
 * Stil içinde başlık fontu istendiğini belirten işaret: `fontFamily: HEADING`.
 * Gerçek dosya adını components/text.tsx ağırlığa göre seçer.
 */
export const HEADING = "heading";

const BODY_BY_WEIGHT: Record<number, string> = {
  400: "PlusJakartaSans_400Regular",
  500: "PlusJakartaSans_500Medium",
  600: "PlusJakartaSans_600SemiBold",
  700: "PlusJakartaSans_700Bold",
};

/** fontWeight değerini yüklü ağırlıklardan en yakınına indirger (800/900 → 700). */
function normalizeWeight(weight: unknown): number {
  if (weight === "bold") return 700;
  const n = typeof weight === "number" ? weight : parseInt(String(weight ?? "400"), 10);
  if (!Number.isFinite(n) || n < 450) return 400;
  if (n < 550) return 500;
  if (n < 650) return 600;
  return 700;
}

/**
 * Android özel fontun kalın halini fontWeight ile seçemez; her ağırlık ayrı bir
 * font adıdır. Bu fonksiyon (fontFamily işareti, fontWeight) çiftini gerçek font
 * adına çevirir.
 */
export function resolveFontFamily(family: unknown, weight: unknown): string {
  const w = normalizeWeight(weight);
  if (family === HEADING) return w >= 700 ? "Fraunces_700Bold" : "Fraunces_600SemiBold";
  return BODY_BY_WEIGHT[w];
}
